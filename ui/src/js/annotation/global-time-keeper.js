/**
 * There are 4 time domains:
 * - media frame: Frame relative to a particular media
 * - global frame: 0-based frame index of stitched media
 * - relative time: 0-based time index of stitched media
 * - absolute time: time based on absolute start time of stitched media
 */
export class GlobalTimeKeeper extends HTMLElement {

  constructor() {
    super();
  }

  /**
   * Sets up the global frame timeline for the particular channel.
   * Temporal gaps for the given channel will be determined.
   * Must be called within init() function.
   *
   * @param {integer} channelIndex
   * @postcondition this._mediaMap entries updated with global frame information
   */
  _createChannelGlobalTimeline(channelIndex) {

    var channelGaps = [];
    var previousGlobalEndFrame = 0;
    const mediaInfoList = this._mediaChannelMap[channelIndex];
    for (let mediaIndex = 0; mediaIndex < mediaInfoList.length; mediaIndex++) {

      var mediaInfo = mediaInfoList[mediaIndex];

      // Set the start frame based on the absolute start time if this is the first media
      // in the channel list. Otherwise, bas
      var deltaEpoch = mediaInfo.startSecondsFromEpoch - this._minSecondsFromEpoch;
      var globalStartFrame = Math.round(deltaEpoch / this._globalFPS);
      
      // Update the mediaInfo object
      var globalEndFrame = globalStartFrame + mediaInfo.media.num_frames - 1;
      mediaInfo.globalStartFrame = globalStartFrame;
      mediaInfo.globalEndFrame = globalEndFrame;

      // Check for temporal gap
      if (previousGlobalEndFrame != globalStartFrame) {
        channelGaps.push({
          globalStartFrame:previousGlobalEndFrame + 1,
          globalEndFrame: globalStartFrame - 1
        });
      }
      previousGlobalEndFrame = globalEndFrame;
    }

    this._channelGaps[channelIndex] = channelGaps;
  }

  /**
   * Gets the start of the media based on its name.
   *
   * @param {Tator.Media} media
   * @returns {float} Start of media in seconds since epoch
   */
  _getMediaStart(media) {

    let name = media.name;

    // Trim off ID if it is there
    if (name[1] == '_') {
      name = name.substr(2);
    }
    let startTime8601 = name.substr(0,name.lastIndexOf('.')).replaceAll("_",':');
    let timeZoneIncluded = startTime8601.lastIndexOf('-') > 7;
    if (timeZoneIncluded != true) {
      startTime8601 += '-00:00'; // Assume zulu time
    }

    // Convert to seconds since epoch (browser local time)
    let msTimeSinceEpoch = Date.parse(startTime8601);

    if (isNaN(msTimeSinceEpoch) == true) {
      throw "Could not deduce time from file name (ID:${media.id} | ${media.name})";
    }

    return msTimeSinceEpoch / 1000;
  }

  /**
   * Initializes the global time tracker with the following list of media.
   * Calling this again will reinitialize everything.
   * This creates the list of temporal gaps too.
   *
   * @param {array} mediaChannels - Array of arrays
   *   Each array represents a video stream/channel
   *   List of media objects to create the global timeline
   *   Assumed that the media all have the same FPS and their names are in an isoformat
   *   Also assumed there are no duplicate media objects
   *
   * @param {float} globalFPS - FPS used for the global tracker.
   */
  init(mediaChannels, globalFPS) {

    this._globalFPS = globalFPS;
    this._mediaMap = {};
    this._temporalGaps = [];
    this._mediaChannelMap = [];
    this._minSecondsFromEpoch = 0;
    this._channelGaps = {}; // Indexed by channel index

    // Loop over the media and figure out how these media are stitched together.
    // Also check each media FPS is the same as the global FPS
    // Also check the name is in the correct timebased format
    let channelIndex = -1;
    for (const mediaList of mediaChannels) {
      channelIndex += 1;
      var mediaMapByChannel = [];

      for (let mediaIndex = 0; mediaIndex < mediaList.length; mediaIndex++) {

        const media = mediaList[mediaIndex];

        // Verify this media's FPS is the same as the global FPS
        if (media.fps != this._globalFPS) {
          throw `Invalid media FPS: ${media.fps} (Global FPS: ${this._globalFPS})`;
        }

        // Get the global frame start and end associated with this media and apply it to the map
        var startTime = this._getMediaStart(media);
        if (startTime > this._minSecondsFromEpoch) {
          this._minSecondsFromEpoch = startTime;
        }

        var mediaInfo = {
          startSecondsFromEpoch: startTime,
          media: media,
          channelIndex: channelIndex,
          numMediaInChannel: mediaList.length,
          mediaIndex: mediaIndex
        };

        this._mediaMap[media.id] = mediaInfo;
        mediaMapByChannel.push(mediaInfo);
      }
      this._mediaChannelMap.push(mediaMapByChannel);
    }

    for (let channelIndex = 0; channelIndex < this._mediaChannelMap.length; channelIndex++) {
      this._createChannelGlobalTimeline(channelIndex);
    }

    this.dispatchEvent(new Event("initialized"));
  }

  /**
   * @param {string} mode - "mediaStart" | "mediaEnd" | "matchFrame"
   * @param {integer} mediaId
   * @param {integer} frame - Only used if mode is "matchFrame"
   * @returns {integer} Global frame associated with provided parameters
   */
  getGlobalFrame(mode, mediaId, frame) {
    var globalFrame;
    if (mode == "mediaStart") {
      globalFrame = this._mediaMap[mediaId].globalStartFrame;
    }
    else if (mode == "mediaEnd") {
      globalFrame = this._mediaMap[mediaId].globalEndFrame;
    }
    else if (mode == "matchFrame") {
      globalFrame = this._mediaMap[mediaId].globalStartFrame + frame;
    }
    return Math.round(globalFrame);
  }

  /**
   * @param {Integer} globalFrame
   * @returns {array} mediaMap objects that match the provided globalFrame
   */
  getMediaInfoFromFrame(globalFrame) {

    var out = [];
    for (const [mediaId, mediaInfo] of this._mediaMap.entries()) {
      if (globalFrame >= mediaInfo.globalStartFrame && globalFrame <= mediaInfo.globalEndFrame) {
        out.push(mediaInfo);
      }
    }
    return out;

  }

  /**
   * @returns {Integer} Last global frame. Add one to this to get number of global frames.
   */
  getLastGlobalFrame() {
    return this._lastGlobalFrame;
  }
}

if (!customElements.get("global-time-keeper")) {
  customElements.define("global-time-keeper", GlobalTimeKeeper);
}
