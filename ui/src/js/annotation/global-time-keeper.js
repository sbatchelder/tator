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
    this._lastGlobalFrame = 0;
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
    var channelTimeline = [];
    var previousGlobalEndFrame = 0;
    const mediaInfoList = this._mediaChannelMap[channelIndex];
    for (let mediaIndex = 0; mediaIndex < mediaInfoList.length; mediaIndex++) {

      var mediaInfo = mediaInfoList[mediaIndex];

      // Set the start frame based on the absolute start time if this is the first media
      // in the channel list. Otherwise, bas
      var deltaEpoch = mediaInfo.startSecondsFromEpoch - this._minSecondsFromEpoch;
      var globalStartFrame = Math.floor(deltaEpoch * this._globalFPS);

      // Update the mediaInfo object
      var globalEndFrame = globalStartFrame + mediaInfo.media.num_frames - 1;
      mediaInfo.globalStartFrame = globalStartFrame;
      mediaInfo.globalEndFrame = globalEndFrame;

      // Check for temporal gap
      if (previousGlobalEndFrame != globalStartFrame) {
        channelGaps.push({
          globalStartFrame: previousGlobalEndFrame + 1,
          globalEndFrame: globalStartFrame - 1
        });
        channelTimeline.push({
          mediaId: null,
          mediaName: null,
          displayName: `Video Gap`,
          globalStartFrame: previousGlobalEndFrame + 1,
          globalEndFrame: globalStartFrame - 1
        });
      }

      // Add media to the channel timeline
      channelTimeline.push({
        mediaId: mediaInfo.media.id,
        mediaName: mediaInfo.media.name,
        displayName: `${mediaInfo.media.name} (ID: ${mediaInfo.media.id})`,
        globalStartFrame: globalStartFrame,
        globalEndFrame: globalEndFrame
      });

      previousGlobalEndFrame = globalEndFrame;
    }

    this._channelGaps[channelIndex] = channelGaps;
    this._channelTimeline[channelIndex] = channelTimeline;

    if (previousGlobalEndFrame > this._lastGlobalFrame) {
      this._lastGlobalFrame = previousGlobalEndFrame;
    }
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
   * @param {Tator.Media} parentMedia
   * @param {array} mediaChannels - Array of arrays
   *   Each array represents a video stream/channel
   *   List of media objects to create the global timeline
   *   Assumed that the media all have the same FPS and their names are in an isoformat
   *   Also assumed there are no duplicate media objects
   *
   * @param {float} globalFPS - FPS used for the global tracker.
   */
  init(parentMedia, mediaChannels, globalFPS) {

    this._parentMedia = parentMedia;
    this._globalFPS = globalFPS;
    this._mediaMap = {};
    this._temporalGaps = [];
    this._mediaChannelMap = [];
    this._minSecondsFromEpoch = Date.now() / 1000;
    this._channelGaps = {}; // Indexed by channel index
    this._channelTimeline = {}; // Indexed by channel index

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
        if (startTime < this._minSecondsFromEpoch) {
          this._minSecondsFromEpoch = startTime;
        }

        var mediaInfo = {
          startSecondsFromEpoch: startTime,
          media: media,
          channelIndex: channelIndex,
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
  }

  /**
   * @param {string} mode - "mediaStart" | "mediaEnd" | "matchFrame" | "utc"
   * @param {array} mediaIdList - Loop through this list of media IDs. If there's a match use that
   *                              to determine the media frame -> global frame mapping.
   * @param {integer|string} time - integer, if "matchFrame", represents frame
   *                                string, if "utc", represets isoformat datetime
   * @returns {integer} Global frame associated with provided parameters
   */
  getGlobalFrame(mode, mediaList, time) {
    var globalFrame;
    var mediaId;

    for (const id of mediaList) {
      if (id in this._mediaMap) {
        mediaId = id;
        break;
      }
    }

    if (mode == "mediaStart") {
      globalFrame = this._mediaMap[mediaId].globalStartFrame;
    }
    else if (mode == "mediaEnd") {
      globalFrame = this._mediaMap[mediaId].globalEndFrame;
    }
    else if (mode == "matchFrame") {
      globalFrame = this._mediaMap[mediaId].globalStartFrame + time;
    }
    else if (mode == "utc") {
      let secondsSinceEpoch = Date.parse(time) / 1000.0;
      globalFrame = (secondsSinceEpoch - this._minSecondsFromEpoch) * this._globalFPS;
    }
    return Math.floor(globalFrame);
  }

  /**
   * @param {integer} globalFrame
   * @returns {array} mediaMap objects that match the provided globalFrame
   */
  getMediaInfoFromFrame(globalFrame) {

    var out = [];
    for (const [mediaId, mediaInfo] of Object.entries(this._mediaMap)) {
      if (globalFrame >= mediaInfo.globalStartFrame && globalFrame <= mediaInfo.globalEndFrame) {
        out.push(mediaInfo);
      }
    }
    return out;
  }

  /**
   * @returns {integer} Last global frame. Add one to this to get number of global frames.
   */
  getLastGlobalFrame() {
    return this._lastGlobalFrame;
  }

  /**
   * @returns {integer} Number of channels in the timeline
   */
  getChannelCount() {
    return this._mediaChannelMap.length;
  }

  /**
   * Get a list of temporal gaps for the given channel
   * @param {integer} channelIndex
   * @returns {array} Array of objects with globalStartFrame and globalEndFrame fields
   *                  that define the channel gaps
   */
  getChannelGaps(channelIndex) {
    return this._channelGaps[channelIndex];
  }

  /**
   * Get a list of media and temporal gap information for the given channel
   * @param {integer} channelIndex
   * @returns {array} Array of objects with the following fields that define the media
   *                  segments and channels gaps.
   *
   *                  Object fields:
   *                  mediaId, mediaName, displayName, globalStartFrame, globalEndFrame
   */
  getChannelTimeline(channelIndex) {
    return this._channelTimeline[channelIndex];
  }

  /**
   * @returns {Tator.Media}
   */
  getParentMedia() {
    return this._parentMedia;
  }

  /**
   * Gets the absolute time from the given global frame.
   *
   * @param {integer} globalFrame
   * @return {string} Provided frame represented as an isostring in absolute time
   */
  getAbsoluteTimeFromFrame(globalFrame) {

    // Convert globalFrame into global seconds
    var globalSeconds = globalFrame / this._globalFPS;

    // Add seconds padding to the start
    var msFromEpoch = 1000 * (this._minSecondsFromEpoch + globalSeconds);

    // Convert seconds from epoch to a date object
    var thisDate = new Date(0);
    thisDate.setUTCMilliseconds(msFromEpoch);

    // Return the isostring
    return thisDate.toISOString();
  }

  /**
   * Gets the relative time from the given global frame.
   *
   * @param {integer} globalFrame
   * @return {string} Provided frame represented as HH:MM:SS in relative time
   */
  getRelativeTimeFromFrame(globalFrame) {
    var hours;
    var minutes;
    var seconds;
    var timeStr;
    var totalSeconds = globalFrame / this._globalFPS;
    hours = Math.floor(totalSeconds / 3600);
    totalSeconds -= hours * 3600;
    minutes = Math.floor(totalSeconds / 60) % 60;
    totalSeconds -= minutes * 60;
    seconds = totalSeconds % 60;
    seconds = seconds.toFixed(0);
    var timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return timeStr;
  }
}

if (!customElements.get("global-time-keeper")) {
  customElements.define("global-time-keeper", GlobalTimeKeeper);
}
