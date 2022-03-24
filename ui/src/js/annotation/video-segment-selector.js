import { TatorElement } from "../components/tator-element.js";
import * as d3 from "d3";

/**
 * Web component that displays the video play segment/window selection.
 */
export class VideoSegmentSelector extends TatorElement {

  constructor() {
    super();

    this._timelineDiv = document.createElement("div");
    this._timelineDiv.setAttribute("class", "py-2");
    this._timelineDiv.id = "video-segment-selector";
    this._shadow.appendChild(this._timelineDiv);

    this._mainSvg = d3.select(this._shadow).select("#video-segment-selector")
      .append("svg")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("font", "14px sans-serif")
      .style("color", "#6d7a96");

    this._div = document.createElement("div");
    this._shadow.appendChild(this._div);

    window.addEventListener("resize", this._updateSvgData());
    this._displayMode = "frame";
    this._axisColor = "#6d7a96";

    var outerDiv = document.createElement("div");
    outerDiv.setAttribute("class", "analysis__filter_conditions d-flex");
    this._div.appendChild(outerDiv)

    var innerDiv = document.createElement("div");
    innerDiv.setAttribute("class", "px-2 py-2 d-flex flex-justify-center col-12")
    innerDiv.style.width = "100%";
    outerDiv.appendChild(innerDiv);

    this.endpointData = {start: {}, end: {}};
    this._createEndpointUI(innerDiv, this.endpointData.start, "Start");
    this._createEndpointUI(innerDiv, this.endpointData.end, "End");

    this._createWindowShiftUI(innerDiv);
    this._createLoadUI(innerDiv);

    this.setDisplayMode("frame");
    this._selectMode = "none";
  }

  _createLoadUI(parentDiv) {
    var div = document.createElement("div");
    div.setAttribute("class", "analysis__filter_field_border d-flex flex-items-center text-gray col-2 f2 mx-3");
    parentDiv.appendChild(div);

    var globalDiv = document.createElement("div");
    globalDiv.setAttribute("class", "d-flex flex-items-center flex-grow text-gray f2 px-1 col-12");
    div.appendChild(globalDiv);

    var label = document.createElement("span");
    label.setAttribute("class", "f2 px-2 col-12 d-flex text-white text-semibold");
    label.textContent = "Load";
    globalDiv.appendChild(label);

    const btn = document.createElement("entity-download-button");
    btn.setAttribute("class", "px-2");
    globalDiv.appendChild(btn);

    btn.addEventListener("click", () => {
      console.log(`Play window: ${this._newWindowStart} ${this._newWindowEnd}`);
      this.dispatchEvent(new CustomEvent("setPlayWindow", {
        composed: true,
        detail: {
          newWindowStart: this._newWindowStart
        }
      }));
    });

    div.hidden = true;
    this._loadDiv = div;
  }

  _createWindowShiftUI(parentDiv) {
    var div = document.createElement("div");
    div.setAttribute("class", "analysis__filter_field_border d-flex flex-items-center text-gray col-2 f2 mx-3");
    parentDiv.appendChild(div);

    var globalDiv = document.createElement("div");
    globalDiv.setAttribute("class", "d-flex flex-items-center flex-grow text-gray f2 px-1 col-12");
    div.appendChild(globalDiv);

    var label = document.createElement("span");
    label.setAttribute("class", "f2 px-2 col-12 d-flex text-white text-semibold");
    label.textContent = "Shift";
    globalDiv.appendChild(label);

    const prev = document.createElement("entity-prev-button");
    prev.setAttribute("class", "px-2");
    globalDiv.appendChild(prev);

    const next = document.createElement("entity-next-button");
    next.setAttribute("class", "px-2");
    globalDiv.appendChild(next);

    prev.addEventListener("click", () => {
      this._displayNewWindow(this._newWindowStart - this._newWindowShiftSize);
      prev.blur();
    });

    next.addEventListener("click", () => {
      this._displayNewWindow(this._newWindowStart + this._newWindowShiftSize);
      next.blur();
    });
  }

  _createEndpointUI(parentDiv, endpointData, title) {
    var div = document.createElement("div");
    endpointData.parentDiv = div;
    div.setAttribute("class", "analysis__filter_field_border d-flex flex-items-center text-gray col-3 f2 mx-3");
    parentDiv.appendChild(div);

    var label;

    var globalDiv = document.createElement("div");
    globalDiv.setAttribute("class", "d-flex flex-items-center flex-grow text-gray f2 px-1 col-12");
    div.appendChild(globalDiv);

    label = document.createElement("span");
    label.setAttribute("class", "f2 px-2 col-4 d-flex text-white text-semibold");
    label.textContent = title;
    globalDiv.appendChild(label);

    endpointData.globalFrame = document.createElement("text-input");
    endpointData.globalFrame.setAttribute("name", "Frame");
    endpointData.globalFrame.permission = "View Only";
    globalDiv.appendChild(endpointData.globalFrame);

    endpointData.globalTime = document.createElement("text-input");
    endpointData.globalTime.setAttribute("name", "Time");
    endpointData.globalTime.permission = "View Only";
    globalDiv.appendChild(endpointData.globalTime);

    if (title != "Duration") {

      endpointData.redrawButton = document.createElement("entity-redraw-button");
      endpointData.redrawButton.style.marginLeft = "15px";
      endpointData.redrawButton.style.marginRight = "8px";
      div.appendChild(endpointData.redrawButton);
      endpointData.redrawButtonActive = false;

      if (title == "Start") {
        endpointData.redrawButton.addEventListener("click", () => {
          if (!endpointData.redrawButtonActive) {
            this._resetSelectMode();
            this._selectMode = "segmentStart";
            endpointData.redrawButtonActive = true;
            div.style.borderColor = "#ffffff";
            this.redraw();
          }
          else {
            this._resetSelectMode();
            this.redraw();
          }
        });
      }
      else if (title == "End") {
        endpointData.redrawButton.addEventListener("click", () => {
          if (!endpointData.redrawButtonActive) {
            this._resetSelectMode();
            this._selectMode = "segmentEnd";
            endpointData.redrawButtonActive = true;
            div.style.borderColor = "#ffffff";
            this.redraw();
          }
          else {
            this._resetSelectMode();
            this.redraw();
          }
        });
      }

    }
    else {
      endpointData.globalFrame.setAttribute("name", "Frames");
    }
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

    var areaDataset = [
      {
        color: "#a2afcd",
        startFrame: this._windowStartFrame,
        endFrame: this._windowEndFrame
      },
    ];

    if (this._showNewWindow) {
      areaDataset.push({
        color: "#ffffff",
        startFrame: this._newWindowStart,
        endFrame: this._newWindowEnd
      });
    }

    this._mainStepPad = 2;
    this._mainStep = 6; // vertical height of each entry in the series / band
    this._mainMargin = ({top: 5, right: 20, bottom: 20, left: 20});
    this._mainHeight =
      1 * (this._mainStep + this._mainStepPad) +
      this._mainMargin.top + this._mainMargin.bottom;
    this._mainWidth = this._timelineDiv.offsetWidth;

    if (this._mainWidth <= 0) { return; }
    this._mainSvg.attr("viewBox",`0 0 ${this._mainWidth} ${this._mainHeight}`);

    // Define the axes
    this._mainX = d3.scaleLinear()
      .domain([0, maxFrame])
      .range([0, this._mainWidth])

    var mainY = d3.scaleLinear()
      .domain([0, 1.0])
      .range([0, -this._mainStep]);

    // #TODO This is clunky and has no smooth transition, but it works for our application
    //       Potentially worth revisiting in the future and updating the dataset directly
    //       using the traditional d3 enter/update/exit paradigm.
    this._mainSvg.selectAll('*').remove();

    if (this._displayMode == "frame") {
      var xAxis = g => g
        .attr("transform", `translate(0,${this._mainMargin.top + this._mainStep})`)
        .call(d3.axisBottom(this._mainX).ticks().tickSizeOuter(0).tickFormat(d3.format("d")))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick").filter(d => this._mainX(d) < this._mainMargin.left * 2 || this._mainX(d) >= this._mainWidth - this._mainMargin.right * 2).remove());
    }
    else if (this._displayMode == "relativeTime") {
      var xAxis = g => g
        .attr("transform", `translate(0,${this._mainMargin.top + this._mainStep})`)
        .call(d3.axisBottom(this._mainX).ticks().tickSizeOuter(0).tickFormat(d => {
          return that._createTimeStr(d);
        }))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick").filter(d => this._mainX(d) < this._mainMargin.left * 2 || this._mainX(d) >= this._mainWidth - this._mainMargin.right * 2).remove());
    }
    this._xAxis = xAxis;

    this._xAxisG = this._mainSvg.append("g")
      .style("font-size", "14px")
      .call(xAxis);

    this._mainSvg.append("g")
      .attr("transform", (d, i) => `translate(0,${i * (this._mainStep + this._mainStepPad) + this._mainMargin.top})`)
      .append("rect")
        .attr("fill", "#4A4EAE")
        .attr("x", this._mainX(0))
        .attr("y", mainY(0))
        .attr("width", this._mainX(maxFrame))
        .attr("height", this._mainStep);

    this._mainSvg.append("g")
        .attr("transform", (d, i) => `translate(0,${i * (this._mainStep + this._mainStepPad) + this._mainMargin.top})`)
        .selectAll("rect")
        .data(areaDataset)
        .join("rect")
          .attr("fill", d => d.color)
          .attr("x", d => this._mainX(d.startFrame))
          .attr("y", mainY(0))
          .attr("width", d => this._mainX(d.endFrame - d.startFrame))
          .attr("height", this._mainStep);

    this._mainFrameLine = this._mainSvg.append("line")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .attr("opacity", "0");

    this._hoverFrameTextBackground = this._xAxisG.append("rect")
      .attr("width", this._mainWidth)
      .attr("height", this._mainStep);

    this._hoverFrameText = this._xAxisG.append("text")
      .style("font-size", "14px")
      .attr("x", this._mainWidth * 0.4)
      .attr("y", 12)
      .attr("fill", "#fafafa");

    if (this._selectMode == "segmentStart" || this._selectMode == "segmentEnd") {

      this._mainSvg.on("click", function(event, d) {
        const pointer = d3.pointer(event, that);
        const pointerFrame = Math.round(that._mainX.invert(pointer[0]));
        const oldSelect = that._selectMode;
        that._resetSelectMode();
        d3.select(that).style("cursor", "default");
        if (oldSelect == "segmentStart") {
          that._displayNewWindow(pointerFrame);
        }
        else {
          that._displayNewWindow(pointerFrame - that._windowDuration);
        }
      });

      this._mainSvg.on("mouseover", function(event, d) {
        that._mainFrameLine.attr("opacity", "1.0");
        that._hoverFrameText.attr("opacity", "1.0");
        that._hoverFrameTextBackground.attr("opacity", "1.0");
        d3.select(that).style("cursor", "pointer");
      });

      this._mainSvg.on("mouseout", function(event, d) {
        that._mainFrameLine.attr("opacity", "0");
        that._hoverFrameText.attr("opacity", "0");
        that._hoverFrameTextBackground.attr("opacity", "0");
        d3.select(that).style("cursor", "default");
      });

      this._mainSvg.on("mousemove", function(event, d) {
        var currentFrame = parseInt(that._mainX.invert(d3.pointer(event)[0]));
        if (currentFrame < 0 || currentFrame > that._maxFrame) {
          that._mainFrameLine.attr("opacity", "0.0");
          that._hoverFrameText.attr("opacity", "0");
          that._hoverFrameTextBackground.attr("opacity", "0");
          return;
        }

        that._mainFrameLine
          .attr("opacity", "1.0")
          .attr("x1", d3.pointer(event)[0])
          .attr("x2", d3.pointer(event)[0])
          .attr("y1", -that._mainStep - that._mainMargin.bottom)
          .attr("y2", that._mainHeight);

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
    }
    else {
      this._mainSvg.on("click", function(event, d) {});
      this._mainSvg.on("mouseover", function(event, d) {});
      this._mainSvg.on("mouseout", function(event, d) {});
      this._mainSvg.on("mousemove", function(event, d) {});
    }
  }

  _resetSelectMode() {
    this._selectMode = "none";
    this.endpointData.start.redrawButtonActive = false;
    this.endpointData.start.parentDiv.style.borderColor = "#262e3d";
    this.endpointData.end.redrawButtonActive = false;
    this.endpointData.end.parentDiv.style.borderColor = "#262e3d";
  }

  _displayNewWindow(newStartFrame) {
    if (newStartFrame < 0) {
      this._newWindowStart = 0;
      this._newWindowEnd = this._windowDuration - 1;
    }
    else if (newStartFrame >= this._maxWindowEndFrame) {
      this._newWindowStart = this._maxWindowEndFrame;
      this._newWindowEnd = this._lastGlobalFrame;
    }
    else {
      this._newWindowStart = newStartFrame;
      this._newWindowEnd = this._newWindowStart + this._windowDuration - 1;
    }
    this._showNewWindow = true;
    this._loadDiv.style.display = "flex";


    this.endpointData.start.globalFrame.setValue(this._newWindowStart);
    this.endpointData.end.globalFrame.setValue(this._newWindowEnd);

    this.endpointData.start.globalTime.setValue(this._createTimeStr(this._newWindowStart));
    this.endpointData.end.globalTime.setValue(this._createTimeStr(this._newWindowEnd));

    this.redraw();
  }

  /**
   * Force a redraw of the timeline
   */
  redraw() {
    this._updateSvgData();
  }

  /**
   *
   * @param {string} mode - "frame"|"relativeTime"
   */
   setDisplayMode(mode) {
    if (mode == "frame") {
      this.endpointData.start.globalFrame.hidden = false;
      this.endpointData.start.globalTime.hidden = true;
      this.endpointData.end.globalFrame.hidden = false;
      this.endpointData.end.globalTime.hidden = true;
    }
    else if (mode == "relativeTime") {
      this.endpointData.start.globalFrame.hidden = true;
      this.endpointData.start.globalTime.hidden = false;
      this.endpointData.end.globalFrame.hidden = true;
      this.endpointData.end.globalTime.hidden = false;
    }

    this._displayMode = mode;
    this.redraw();
  }

  /**
   * @param {integer} lastGlobalFrame
   * @param {integer} windowStartFrame
   * @param {integer} windowEndFrame
   * @param {float} fps
   */
  init(lastGlobalFrame, windowStartFrame, windowEndFrame, fps) {
    this._fps = fps;
    this._lastGlobalFrame = lastGlobalFrame;
    this._windowStartFrame = windowStartFrame;
    this._windowEndFrame = windowEndFrame;
    this._windowDuration = windowEndFrame - windowStartFrame + 1
    this._maxWindowEndFrame = this._lastGlobalFrame - this._windowDuration;

    this.endpointData.start.globalFrame.setValue(windowStartFrame);
    this.endpointData.end.globalFrame.setValue(windowEndFrame);

    this.endpointData.start.globalTime.setValue(this._createTimeStr(windowStartFrame));
    this.endpointData.end.globalTime.setValue(this._createTimeStr(windowEndFrame));

    this._minFrame = 0;
    this._maxFrame = lastGlobalFrame;

    this._showNewWindow = false;
    this._loadDiv.style.display = "none";
    this._newWindowStart = windowStartFrame;
    this._newWindowEnd = windowEndFrame;
    this._newWindowShiftSize = Math.floor((windowEndFrame - windowStartFrame)/2);

    this._resetSelectMode();
    this.redraw();
  }
}

customElements.define("video-segment-selector", VideoSegmentSelector);