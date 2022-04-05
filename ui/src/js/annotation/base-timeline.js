import { TatorElement } from "../components/tator-element.js";

/** @abstract */
export class BaseTimeline extends TatorElement {

  constructor() {
    super();

    this._displayMode = "frame";
  }

  /**
   * Converts the provided frame number into a corresponding time string
   * @param {integer} frame
   * @returns {string} hh:mm:ss.aa
   */
  _createTimeStr(frame) {
    var hours;
    var minutes;
    var seconds;
    var timeStr;
    var totalSeconds = frame / this._fps;
    hours = Math.floor(totalSeconds / 3600);
    totalSeconds -= hours * 3600;
    minutes = Math.floor(totalSeconds / 60) % 60;
    totalSeconds -= minutes * 60;
    seconds = totalSeconds % 60;
    seconds = seconds.toFixed(0);
    var timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return timeStr;
  }

  /**
   * @abstract
   */
  _updateSvgData() {}

  /**
   * Call this to initialize the timeline.
   * This will default the display mode to frames.
   *
   * @abstract
   * @param {integer} minFrame
   * @param {integer} maxFrame
   * @param {float} fps
   */
  init(minFrame, maxFrame, fps) {}

  /**
   * Force a redraw of the timeline
   */
  redraw() {
    this._updateSvgData();
  }

  /**
   * Sets the display mode of the timeline and forces a redraw
   * @param {string} mode "frame"|"relativeTime"
   */
  setDisplayMode(mode) {
    const validOptions = ["frame", "relativeTime"]
    if (!validOptions.includes(mode)) {
      throw `Invalid mode (${mode}) provided to setDisplayMode`;
    }

    this._displayMode = mode;
    this.redraw();
  }

}