// Module using WebCodecs API to decode video instead of MediaSource Extensions
// reference: https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API

// Attempt is made to partially implement the HTML5 MediaElement interface
// such that this is a drop-in replacement for frame accurate MSE applications
// 
// @TODO: Supply a 'cv2.VideoDecode.read()' type interface for client-side decode
//        operations.


// TimeRanges isn't user constructable so make our own
export class TatorTimeRanges {
  constructor()
  {
    this._buffer=[];
  }

  get length()
  {
    return this._buffer.length;
  }

  clear()
  {
    this._buffer=[];
  }

  start(idx)
  {
    if (idx >= this._buffer.length)
    {
      throw `${idx} not a valid segment`;
    }
    return this._buffer[idx][0];
  }

  end(idx)
  {
    if (idx >= this._buffer.length)
    {
      throw `${idx} not a valid segment`;
    }
    return this._buffer[idx][1];
  }

  push(start,end)
  {
    this._buffer.push([start,end]);
    this._merge_collapse();
  }

  remove(start, end)
  {
    for (let idx = 0; idx < this.length; idx++)
    {
      if (end > this.start(idx) && end <= this.end(idx))
      {
        this._buffer[idx][0] = end;
      }
    }
    this._merge_collapse();
  }

  print(name)
  {
    if (name)
      console.info(`${name} Buffered ranges:`)
    else
      console.info("Buffered ranges:")
    for (let idx = 0; idx < this.length; idx++)
    {
      console.info(`\t${this.start(idx)} to ${this.end(idx)}`);
    }
  }

  _merge_collapse()
  {
    // Sort by start time
    this._buffer.sort((a,b)=>a[0]-b[0]);
    let merge_list=[];
    for (let idx = 0; idx < this._buffer.length-1; idx++)
    {
      if (this._buffer[idx][0] >= this._buffer[idx+1][0] && this._buffer[idx][0] < this._buffer[idx+1][1])
      {
        merge_list.push([idx,idx+1]);
        break;
      }
      else if (this._buffer[idx][1] >= this._buffer[idx+1][0] && this._buffer[idx][0] < this._buffer[idx+1][1])
      {
        merge_list.push([idx,idx+1]);
        break;
      }
      else if (this._buffer[idx][1] == this._buffer[idx+1][0])
      {
        merge_list.push([idx,idx+1]);
        break;
      }
    }

    if (merge_list.length > 0)
    {
      let first = merge_list[0][0];
      let second = merge_list[0][1];
      this._buffer[second][0] = Math.min(this._buffer[first][0], this._buffer[second][0]);
      this._buffer[second][1] = Math.max(this._buffer[first][1], this._buffer[second][1]);
      this._buffer.splice(first,1);
      return this._merge_collapse();
    }
    else
    {
      return false;
    }
  }
}
class TatorVideoManager {
  constructor(parent, name)
  {
    this._name = name;
    this._parent = parent;
    this.use_codec_buffer = true;
    this._time_ranges = new TatorTimeRanges();

    // TODO: This worker is really an mp4 demuxer, should rename
    this._codec_worker = new Worker(new URL("./video-codec-worker.js", import.meta.url),
                                    {'name': `${name} Worker`});
    this._codec_worker.onmessage = this._on_message.bind(this);

    this._codec_worker.postMessage({"type": "init", "name": this._name});
    // For  lack of a better guess put the default video cursor at 0
    this._current_cursor = 0.0;

    this._hot_frames = new Map();
    this._playing = false;
    this._timescaleMap = new Map();
    this._frameDeltaMap = new Map();
    this._bias = 0;
    this._keyframeOnly = false;
  }

  set keyframeOnly(val)
  {
    this._keyframeOnly = val;
    this._codec_worker.postMessage({"type": "keyframeOnly", "value": val});
  }

  get keyframeOnly()
  {
    return this._keyframeOnly;
  }

  _on_message(msg)
  {
    
    if (msg.data.type == "ready")
    {
      this._codec_string = msg.data.data.tracks[0].codec;
      this._timescaleMap.set(msg.data.timestampOffset,msg.data.data.tracks[0].timescale);
      if (this._parent._loadedDataCallback)
      {
        this._parent._loadedDataCallback();
        this._parent._loadedDataCallback=null;
      }
    }
    else if (msg.data.type == "frame")
    {
      this._frameReady(msg.data);
    }
    else if (msg.data.type == "error")
    {
      console.warn(msg.data);
    }
    else if (msg.data.type == "frameDelta")
    {
      this._frameDeltaMap.set(msg.data.timestampOffset, msg.data.frameDelta);
    }
    else if (msg.data.type == "image")
    {
      this._imageReady(msg.data);
    }
    else if (msg.data.type == "buffered")
    {
      //this._time_ranges.print(`${this._name} Pre-Update`);
      this._time_ranges.clear();
      for (let idx = 0; idx < msg.data.ranges.length; idx++)
      {
        this._time_ranges.push(msg.data.ranges[idx][0], msg.data.ranges[idx][1]);
      }
      //this._time_ranges.print(`${this._name} Latest`);
      if (this.onBuffered)
      {
        setTimeout(this.onBuffered, 0);
      }
    }
    else if (msg.data.type == "onReset")
    {
      if (this.onReset)
      {
        this.onReset();
      }
    }
  }

  // Returns true if the cursor is in the range of the hot frames
  _cursor_is_hot()
  {
    let timestamps = this._hot_frames.keys() // make sure keys are sorted!
    for (let timestamp of timestamps)
    {
      let image_timescale = this._hot_frames.get(timestamp).timescale;
      let frame_delta = this._hot_frames.get(timestamp).frameDelta;
      let cursor_in_ctx = this._current_cursor * image_timescale;
      if (cursor_in_ctx >= timestamp && cursor_in_ctx < timestamp+frame_delta)
      {
        return true;
      }
    }
   
    return false;
  }

  _frameReady(msg)
  {
    // If there is a frame handler callback potentially avoid 
    // internal buffering.
    if (this.onFrame && this._playing == true)
    {
      this._current_cursor = msg.data.cursor;
      if (this.onFrame(msg.data, msg.timescale))
      {
        return;
      }
    }

    // If the client didn't claim the frame, return the memory
    msg.data.close();
  }

  _imageReady(image)
  {
    //console.info(`${performance.now()}: GOT ${image.timestamp}`);
    image.data.timescale = image.timescale;
    image.data.frameDelta = image.frameDelta;
    this._hot_frames.set(image.timestamp, image.data);
    this._clean_hot();
    if (this._cursor_is_hot() || this._keyframeOnly == true)
    {
      image.data.time = image.timestamp / image.data.timescale;
      this._safeCall(this.oncanplay);
    }
  }

  _safeCall(func_ptr)
  {
    if (func_ptr)
    {
      func_ptr();
    }
  }

  // Find the nearest object without going over
  _barkerSearch(mapObject, key)
  {
    let keys = [...mapObject.keys()].sort((a,b)=>{return a-b;});
    let idx = 0;
    for (idx = 0; idx < keys.length; idx++)
    {
      if (keys[idx] > key)
      {
        break;
      }
    }

    let found_idx = Math.max(0, idx-1);

    return {obj: mapObject.get(keys[found_idx]),
            key: keys[found_idx]};
  }

  // The seek buffer can keep up to 10 frames pre-decoded ready to go in either direction
  // to support extra fast prev/next 
  _clean_hot()
  {
    if (this._hot_frames.size < 10)
    {
      return;
    }
    
    let search = this._barkerSearch(this._timescaleMap, this._current_cursor);
    let timescale = search.obj;
    let delete_elements = [];
    let cursor_in_ctx = this._current_cursor * timescale;
    let timestamps = [...this._hot_frames.keys()];
    for (let hot_frame of timestamps)
    {
      // Only keep a max of 100 frames in memory
      if (Math.abs(hot_frame - cursor_in_ctx)/this._frameDeltaMap.get(search.key) >= 10)
      {
        delete_elements.push(hot_frame);
      }
    }
    for (let key of delete_elements)
    {
      this._hot_frames.delete(key);
    }

    if (this._hot_frames.size > 20)
    {
      console.error("Garbage collection is not working!");
    }
  }

  _closest_frame_to_cursor()
  {
    let timescale = this._barkerSearch(this._timescaleMap, this._current_cursor).obj;
    const cursorInCts = this._current_cursor*timescale;
    let lastDistance = Number.MAX_VALUE;
    let lastTimestamp = 0;
    let timestamps = [...this._hot_frames.keys()].sort((a,b)=>a-b); // make sure keys are sorted!
    for (let timestamp of timestamps)
    {
      let thisDistance = Math.abs(timestamp-cursorInCts);
      if (thisDistance > lastDistance)
      {
        break;
      }
      else
      {
        lastDistance = thisDistance
        lastTimestamp = timestamp;
      }
    }
    return this._hot_frames.get(lastTimestamp);
  }

  ///////////////////////////////////////////////////////////
  // Public interface mirrors that of a standard HTML5 video
  ///////////////////////////////////////////////////////////

  set bias(bias)
  {
    this._bias = bias;
  }
  // Set the current video time
  //
  // Timing considerations:
  // - This will either grab from pre-decoded frames and run very quickly or
  //   jump to the nearest preceding keyframe and decode new frames (slightly slower)
  set currentTime(video_time)
  {
    if (this._codec_string == undefined)
    {
      console.info("Can not seek until file is loaded.")
      return;
    }
    
    // If we are approximating seeking, we should land on the nearest buffered time
    if (this.summaryLevel)
    {
      const approx = Math.floor(video_time / this.summaryLevel)*this.summaryLevel;
      for (let idx = 0; idx < this.buffered.length; idx++)
      {
        if (approx >= this.buffered.start(idx) && approx < this.buffered.end(idx))
        {
          this._current_cursor = approx;
          break;
        }
        else if (Math.abs(approx - this.buffered.start(idx)) < this.summaryLevel)
        {
          this._current_cursor = this.buffered.start(idx);
          break;
        }
      }
      //console.info(`${this._name}: SUMMARIZING ${video_time} to ${this._current_cursor} via ${this.summaryLevel}`);
    }
    else
    {
      // Keep worker and manager up to date.
      this._current_cursor = video_time+this._bias;
    }
    const is_hot = this._cursor_is_hot();
    this._codec_worker.postMessage(
      {"type": "currentTime",
       "currentTime": this._current_cursor,
       "videoTime": video_time,
       "bias": this._bias,
       "informational": is_hot
    });
    if (is_hot)
    {
      this._safeCall(this.oncanplay);
      return;
    }
  }

  /// Return a list of TimeRange objects representing the downloaded/playable regions of the
  /// video data.
  get buffered()
  {
    return this._time_ranges;
  }

  // Returns the current video cursor position
  get currentTime()
  {
    return this._current_cursor;
  }

  // Property to get the underlying video object R/O property
  //
  // The actual type being returned here is either null or a valid ImageData
  // ImageData can be pashed to texIamge2d in webgl2 contexts or putImageData in
  // 2d contexts, or one can use image bitmap renderer contexts. 
  //
  // Example:
  //      canvasCtx = canvas.getContext('2d');
  //      canvasCtx.putImage(myVideo.codec_image_buffer,0,0);
  //
  // @TODO: Do we need to handle an explicit GL mode a bit more optimized? 
  //        - We could return back a gl buffer in the context of the rendering stack
  //        - Currently we use an 'ImageData' reference from the internal OffscreenCanvas data
  get codec_image_buffer()
  {
    if (this._cursor_is_hot() || this._keyframeOnly == true)
    {
      return this._closest_frame_to_cursor();
    }
    else
    {
      console.error(`${this._name}: NULL For ${this._current_cursor}`);
      return null;
    }
  }

  // Append data to the mp4 file
  // - This data should either be sequentially added or added on a segment boundary
  // - Prior to adding video segments the mp4 header must be supplied first.
  appendBuffer(data, timestampOffset)
  {
    if (timestampOffset == undefined)
    {
      timestampOffset = 0;
    }
    const fileStart = data.fileStart;
    const frameStart = data.frameStart;
    this._codec_worker.postMessage(
      {"type": "appendBuffer",
       "fileStart": fileStart,
       "frameStart": frameStart,
       "timestampOffset": timestampOffset,
       "data": data
      });
  }

   // Append data to the mp4 file (seek alt)
  // - This data should either be sequentially added or added on a segment boundary
  // - Prior to adding video segments the mp4 header must be supplied first.
  appendSeekBuffer(data, time, timestampOffset)
  {
    if (timestampOffset == undefined)
    {
      timestampOffset = 0;
    }
    const fileStart = data.fileStart;
    const frameStart = data.frameStart;
    this._codec_worker.postMessage(
      {"type": "appendSeekBuffer",
       "fileStart": fileStart,
       "frameStart": frameStart,
       "timestampOffset": timestampOffset,
       "data": data
      });
  }

  deleteUpTo(seconds)
  {
    this._codec_worker.postMessage({"type": "deleteUpTo",
                                   "seconds": seconds});
  }

  pause()
  {
    this.onFrame = null;
    this._playing = false;
    this._codec_worker.postMessage(
      {"type": "pause"});
  }

  play()
  {
    this._playing = true;
    this._codec_worker.postMessage(
      {"type": "play"});
  }
}

export class TatorVideoDecoder {
  constructor(id)
  {
    console.info("Created WebCodecs based Video Decoder");
    this._buffer = new TatorVideoManager(this, `Video Buffer ${id}`);
    this._init = false;
    this._buffer.onBuffered = () => {
      //this._buffer.buffered.print(`${id} LATEST`);
      if (this.onBuffered)
      {
        setTimeout(this.onBuffered,0);
      }
    };
  }

  compat(videoUrl) {
    this._compatVideo = document.createElement("VIDEO");
    this._compatVideo.setAttribute("crossorigin", "anonymous");
    this._compatVideo.src = videoUrl;
    this._compatVideo.load();
    this._compat = true;
  }

  getMediaElementCount() {
    // 1 for seek video, 1 for onDemand video, 1 for all of the scrub
    return 3;
  }

  // Save off the initialization data for this mp4 file
  saveBufferInitData(data) {
    this._ftypInfo = data;
  }

  clearScrubBuffer() {

  }

  recreateOnDemandBuffers(callback) {
    this.reset().then(() => {
      callback();
    });
  }

  status()
  {
    
  }

  pause(time)
  {
    if (this._compat)
    {
      return;
    }
    this._buffer.pause();
    if (time)
    {
      this._buffer.currentTime = time;
    }
  }

  play()
  {
    if (this._compat)
    {
      return;
    }
    let timestamps = this._hot_frames.keys();
    for (let idx = 0; idx < timestamps.length; idx++)
    {
      this._hot_frames.get(timestamps[idx]).close();
      this._hot_frames.delete(timestamps[idx]);
    }
    this._buffer.play();
  }

  /**
   * Return the source buffer associated with the given frame / buffer type. Or null if not present
   *
   * @param {float} time - Seconds timestamp of frame request
   * @param {string} buffer - "play" | "scrub"
   * @param {Direction} direction - Forward or backward class
   * @param {float} maxTime - Maximum number of seconds in the video
   * @returns Video element based on the provided time. Returns null if the given time does not
   *          match any of the video buffers.
   */
  forTime(time, buffer, direction, maxTime)
  {
    if (this._compatVideo)
    {
      return this._compatVideo;
    }

    const ranges = this._buffer.buffered;
    for (let idx = 0; idx < ranges.length; idx++)
    {
      if (time >= ranges.start(idx) && time <= ranges.end(idx))
      {
        return this._buffer;
      }
    }
    return null;
  }

  // Returns the seek buffer if it is present, or
  // The time buffer if in there
  returnSeekIfPresent(time, direction)
  {
    return this.forTime(time, direction);
  }

  playBuffer()
  {
    return this._buffer;
  }

  /**
   * Queues the requests to delete buffered onDemand video ranges
   */
  resetOnDemandBuffer()
  {
    let p_func = (resolve, reject) => 
    {
      this.reset().then(() => {
        this.buffered.print(`${this._name} RESET`);
        resolve();
      });
    };
    let p = new Promise(p_func);
    return p;
  }

  /**
   * @returns {boolean} True if the onDemand buffer has no data
   */
  isOnDemandBufferCleared()
  {
    
  }

  /**
   * @returns {boolean} True if the onDemand buffer is busy
   */
  isOnDemandBufferBusy()
  {
    return false;
  }

  /**
   * If there are any pending deletes for the onDemand buffer, this will rotate through
   * them and delete them
   */
  cleanOnDemandBuffer()
  {
 
  }

  /**
   * Removes the given range from the play buffer
   * @param {tuple} delete_range - start/end (seconds)
   */
  deletePendingOnDemand(delete_range)
  {
    this._buffer.deleteUpTo(delete_range[1]);
  }

  seekBuffer()
  {
    return this._buffer;
  }

  currentIdx()
  {
    
  }

  error()
  {
    
  }

  /**
   * Used for initialization of the video object.
   * @returns Promise that is resolved when the first video element is in the ready state or
   *          data has been loaded. This promise is rejected if an error occurs
   *          with the video element.
   */
  loadedDataPromise(parent)
  {
    let p = new Promise((resolve, reject) => {
      if (this._init)
      {
        resolve();
      }
      else
      {
        this._loadedDataCallback = resolve;
        this._loadedDataError = reject;
      }
    });
    return p;
  }

  /**
   * If there are any pending deletes for the seek buffer, this will rotate through them
   * and delete them
   */
  cleanSeekBuffer()
  {

  }

  reset()
  {
    console.info(`RESETTING ${this._name}`)
    return new Promise((resolve) => {
      this._buffer.onReset = () => {resolve();
                                    this._buffer.onReset=null
                                  };
      this._buffer._codec_worker.postMessage({"type": "reset"});
                                });
  }

  appendSeekBuffer(data, time, timestampOffset)
  {
    this._buffer.appendSeekBuffer(data, time, timestampOffset);
  }

  appendLatestBuffer(data, callback, timestampOffset)
  {
    this._buffer.appendBuffer(data, timestampOffset);
    setTimeout(callback,0);
  }

  /**
   * Appends the video data to the onDemand buffer.
   * After the buffer has been updated, the callback routine will be called.
   *
   * @param {bytes} data - Video segment
   * @param {function} callback - Callback executed once the buffer has been updated
   * @param {bool} force - Force update if true. False will yield updates only if init'd
   */
  appendOnDemandBuffer(data, callback, force, timestampOffset)
  {
    //console.info(`${JSON.stringify(data)}`);
    // Fail-safe, if we have a frame start this is the start of a new buffer
    // and we need to clear everything we had.
    this.appendLatestBuffer(data, callback, timestampOffset);
  }

  /**
   * Appends data to all buffers (generally init information)
   * @param {*} data 
   * @param {*} callback 
   * @param {*} force 
   */
  appendAllBuffers(data, callback, force, timestampOffset)
  {
    console.info("Appending All Buffers");
    if (this._init == false || force == true)
    {
      this._buffer.appendBuffer(data, timestampOffset);
    }
    this._init = true;
    setTimeout(callback,0); // defer to next clock
  }
}
