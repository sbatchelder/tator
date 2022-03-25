import { TatorElement } from "../components/tator-element.js";
import * as d3 from "d3";
/**
 * Web component that displays the video timeline axis in the annotator.
 *
 * Events dispatched:
 * "seekFrame"
 *    Sent when user selects a particular frame to seek to
 *    evt.detail.frame {integer}
 */
export class VideoTimeline extends TatorElement {
  constructor() {
    super();

    this._timelineDiv = document.createElement("div");
    this._timelineDiv.id = "video-timeline";
    this._shadow.appendChild(this._timelineDiv);

    this._mainSvg = d3.select(this._shadow).select("#video-timeline")
      .append("svg")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("font", "14px sans-serif")
      .style("color", "#6d7a96");

    window.addEventListener("resize", this._updateSvgData());
    this._displayMode = "frame";
    this._axisColor = "#6d7a96";
  }

  /**
   * Converts the provided frame number into a corresponding time string
   * @param {Integer} frame
   * @returns {String} hh:mm:ss.aa
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
   * Called whenever there's new data to be displayed on the timeline
   */
  _updateSvgData() {
    this._drawTimeline()
  }

  /**
   *
   */
  _drawTimeline() {

    var that = this;
    var maxFrame = this._maxFrame;
    if (isNaN(maxFrame)) {
      return;
    }

    this._mainStepPad = 2;
    this._mainStep = 10; // vertical height of each entry in the series / band
    this._mainMargin = ({top: 5, right: 20, bottom: 10, left: 20});
    this._mainHeight =
      1 * (this._mainStep + this._mainStepPad) +
      this._mainMargin.top + this._mainMargin.bottom;
    this._mainWidth = this._timelineDiv.offsetWidth;

    if (this._mainWidth <= 0) { return; }
    this._mainSvg.attr("viewBox",`0 0 ${this._mainWidth} ${this._mainHeight}`);

    // Define the axes
    this._mainX = d3.scaleLinear()
      .domain([this._minFrame, this._maxFrame])
      .range([0, this._mainWidth])

    if (this._zoomTransform != null) {
      this._mainX.range([0, this._mainWidth].map(d => this._zoomTransform.applyX(d)));
    }

    // #TODO This is clunky and has no smooth transition, but it works for our application
    //       Potentially worth revisiting in the future and updating the dataset directly
    //       using the traditional d3 enter/update/exit paradigm.
    this._mainSvg.selectAll('*').remove();

    if (this._displayMode == "frame") {
      var xAxis = g => g
        .attr("transform", `translate(0,${this._mainMargin.top})`)
        .call(d3.axisBottom(this._mainX).ticks().tickSizeOuter(0).tickFormat(d3.format("d")))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick").filter(d => this._mainX(d) < this._mainMargin.left * 2 || this._mainX(d) >= this._mainWidth - this._mainMargin.right * 2).remove());
    }
    else if (this._displayMode == "relativeTime") {
      var xAxis = g => g
        .attr("transform", `translate(0,${this._mainMargin.top})`)
        .call(d3.axisBottom(this._mainX).ticks().tickSizeOuter(0).tickFormat(d => {
          return that._createTimeStr(d);
        }))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick").filter(d => this._mainX(d) < this._mainMargin.left * 2 || this._mainX(d) >= this._mainWidth - this._mainMargin.right * 2).remove());
    }
    this._xAxis = xAxis;

    this._xAxisG = this._mainSvg.append("g")
      .style("font-size", "12px")
      .call(xAxis);

    this._mainFrameLine = this._mainSvg.append("line")
      .attr("stroke", "#fafafa")
      .attr("stroke-width", 1)
      .attr("opacity", "0");

    this._mainFrameLineEnd = this._mainSvg.append("circle")
      .style("fill", "#fafafa")
      .attr("r", 5)
      .attr("opacity", "0");

    this._hoverFrameTextBackground = this._xAxisG.append("rect")
      .attr("width", this._mainWidth)
      .attr("height", this._mainStep);

    this._hoverFrameText = this._xAxisG.append("text")
      .style("font-size", "14px")
      .attr("x", this._mainWidth * 0.4)
      .attr("y", 10)
      .attr("fill", "#fafafa");

    this._zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [this._mainWidth, this._mainHeight]])
      .on("zoom", function (event) {
        that._zoomTransform = event.transform;
        that._mainX.range([0, that._mainWidth].map(d => event.transform.applyX(d)));
        that._xAxisG.call(that._xAxis);

        console.log(`new x-axis: ${that._mainX.invert(0)} ${that._mainX.invert(that._mainWidth)}`);
        that.dispatchEvent(new CustomEvent("newFrameRange", {
          detail: {
            start: Math.max(0,Math.round(that._mainX.invert(0))),
            end: Math.min(that._maxFrame,Math.round(that._mainX.invert(that._mainWidth)))
          }
        }));
      });

    this._mainSvg.call(this._zoom);

    if (this._hoverFrame != null) {
      this._mainFrameLine
        .attr("opacity", "1.0")
        .attr("x1", this._mainX(this._hoverFrame))
        .attr("x2", this._mainX(this._hoverFrame))
        .attr("y1", -this._mainStep - this._mainMargin.bottom - 3)
        .attr("y2", this._mainHeight);

        this._hoverFrameText.attr("opacity", "1.0");
        this._hoverFrameTextBackground.attr("opacity", "1.0");

        if (this._displayMode == "frame") {
          this._hoverFrameText.text(this._hoverFrame);
        }
        else if (this._displayMode == "relativeTime") {
          this._hoverFrameText.text(this._createTimeStr(this._hoverFrame));
        }

        if (this._mainX(this._hoverFrame) < this._mainWidth * 0.5) {
          this._hoverFrameText
            .attr("x", this._mainX(this._hoverFrame) + 15)
            .attr("text-anchor", "start");
        }
        else {
          this._hoverFrameText
            .attr("x", this._mainX(this._hoverFrame) - 15)
            .attr("text-anchor", "end");
        }

        var textBBox = this._hoverFrameText.node().getBBox();

        this._hoverFrameTextBackground
          .attr("opacity", "1.0")
          .attr("x", textBBox.x - textBBox.width / 4)
          .attr("y", textBBox.y)
          .attr("width", textBBox.width + textBBox.width / 2)
          .attr("height", textBBox.height)
          .attr("fill", "#151b28");
    }

    /*
    this._mainSvg.on("click", function(event, d) {
      var selectedFrame = parseInt(that._mainX.invert(d3.pointer(event)[0]));
      if (selectedFrame >= that._minFrame && selectedFrame <= that._maxFrame) {
        that.dispatchEvent(new CustomEvent("selectFrame", {
          detail: {
            frame: selectedFrame
          }
        }));
      }
    });
    this._mainSvg.on("mouseover", function(event, d) {
      that._mainFrameLine.attr("opacity", "0");
      that._mainFrameLineEnd.attr("opacity", "1.0");
      that._hoverFrameText.attr("opacity", "1.0");
      that._hoverFrameTextBackground.attr("opacity", "1.0");
      d3.select(this).style("cursor", "pointer");
    });
    this._mainSvg.on("mouseout", function(event, d) {
      that._mainFrameLine.attr("opacity", "0");
      that._mainFrameLineEnd.attr("opacity", "0");
      that._hoverFrameText.attr("opacity", "0");
      that._hoverFrameTextBackground.attr("opacity", "0");
      d3.select(that).style("cursor", "default");
    });
    this._mainSvg.on("mousemove", function(event, d) {
      var currentFrame = parseInt(that._mainX.invert(d3.pointer(event)[0]));
      if (currentFrame < 0 || currentFrame > that._maxFrame) {
        that._mainFrameLine.attr("opacity", "0");
        that._mainFrameLineEnd.attr("opacity", "0");
        that._hoverFrameText.attr("opacity", "0");
        that._hoverFrameTextBackground.attr("opacity", "0");
        return;
      }

      that._mainFrameLine
        .attr("opacity", "0")
        .attr("x1", d3.pointer(event)[0])
        .attr("x2", d3.pointer(event)[0])
        .attr("y1", -that._mainStep - that._mainMargin.bottom - 3)
        .attr("y2", that._mainHeight);

      that._mainFrameLineEnd
        .attr("opacity", "1.0")
        .attr("cx", d3.pointer(event)[0])
        .attr("cy", 5);

      if (that._displayMode == "frame") {
        that._hoverFrameText.text(currentFrame);
      }
      else if (that._displayMode == "relativeTime") {
        that._hoverFrameText.text(that._createTimeStr(currentFrame));
      }

      if (d3.pointer(event)[0] < that._mainWidth * 0.5) {
        that._hoverFrameText
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("text-anchor", "start");
      }
      else {
        that._hoverFrameText
          .attr("x", d3.pointer(event)[0] - 15)
          .attr("text-anchor", "end");
      }

      var textBBox = that._hoverFrameText.node().getBBox();

      that._hoverFrameTextBackground
        .attr("opacity", "1.0")
        .attr("x", textBBox.x - textBBox.width / 4)
        .attr("y", textBBox.y)
        .attr("width", textBBox.width + textBBox.width / 2)
        .attr("height", textBBox.height)
        .attr("fill", "#151b28");
    });
    */
  }

  /**
   * Force a redraw of the timeline
   */
  redraw() {
    this._updateSvgData();
  }

  /**
   * Call this to initialize the timeline.
   * This will default the display mode to frames.
   *
   * @param {integer} minFrame
   * @param {integer} maxFrame
   * @param {float} fps
   */
  init(minFrame, maxFrame, fps) {

    if (minFrame != this._minFrame && this._maxFrame != maxFrame){
      // Reset the zoom if the play window has changed
      this._zoomTransform = null;
    }

    this._minFrame = minFrame;
    this._maxFrame = maxFrame;
    this._fps = fps;
    this._hoverFrame = null;
    this.redraw();
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
    this._updateSvgData();
  }

  updateTimelineColor(axisColor) {
    this._axisColor = axisColor;
    this._updateSvgData();
  }

  showFrameHover(frame) {
    this._hoverFrame = frame;
    this._updateSvgData();
  }

  hideFrameHover() {
    this._hoverFrame = null;
    this._updateSvgData();
  }

  /**
   * Manual zoom controls
   */

  zoomIn() {
    this._zoom.scaleBy(this._mainSvg.transition().duration(250), 2);
  }
  zoomOut() {
    this._zoom.scaleBy(this._mainSvg.transition().duration(250), 0.5);
  }
  panLeft() {
    this._zoom.translateBy(this._mainSvg.transition().duration(250), 50, 0);
  }
  panRight() {
    this._zoom.translateBy(this._mainSvg.transition().duration(250), -50, 0);
  }
  resetZoom() {
    this._zoom.scaleTo(this._mainSvg.transition().duration(250), 1);
  }
}

customElements.define("video-timeline", VideoTimeline);
