import { BaseTimeline } from "../annotation/base-timeline.js";
import * as d3 from "d3";

/**
 * Web component that displays the video play segment/window selection.
 */
export class VideoSegmentSelector extends BaseTimeline {

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

    window.addEventListener("resize", this._updateSvgData());

    this.createPlayWindowControls(this._shadow);

    this._selectMode = "none";

    this._windowStartFrame = 0;
    this._windowEndFrame = 1;
  }

  _createLoadUI(parentDiv) {
    var div = document.createElement("div");
    div.setAttribute("class", "video-segment-field d-flex flex-items-center text-gray col-2 f2 mx-3");
    parentDiv.appendChild(div);

    var globalDiv = document.createElement("div");
    globalDiv.setAttribute("class", "d-flex flex-items-center flex-grow text-gray f2 px-2 col-12");
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
    div.setAttribute("class", "video-segment-field d-flex flex-items-center text-gray col-2 f2 mx-3");
    parentDiv.appendChild(div);

    var globalDiv = document.createElement("div");
    globalDiv.setAttribute("class", "d-flex flex-items-center flex-grow text-gray f2 px-2 col-12");
    div.appendChild(globalDiv);

    var label = document.createElement("span");
    //label.setAttribute("class", "f2 px-2 col-12 d-flex text-white text-semibold");
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
    div.setAttribute("class", "video-segment-field d-flex flex-items-center text-gray col-3 f2 mx-3");
    parentDiv.appendChild(div);

    var label;

    var globalDiv = document.createElement("div");
    globalDiv.setAttribute("class", "d-flex flex-items-center flex-grow text-gray f2 px-2 col-12");
    div.appendChild(globalDiv);

    label = document.createElement("span");
    label.setAttribute("class", "f2 px-2 col-4 d-flex text-white text-semibold");
    label.textContent = title;
    //globalDiv.appendChild(label);

    endpointData.globalFrame = document.createElement("text-input");
    endpointData.globalFrame.setAttribute("name", title);
    endpointData.globalFrame.permission = "View Only";
    globalDiv.appendChild(endpointData.globalFrame);

    endpointData.globalTime = document.createElement("text-input");
    endpointData.globalTime.setAttribute("name", title);
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
            div.classList.add("active");
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
            div.classList.add("active");
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

    var numChannels = this._timeKeeper.getChannelCount();
    for (let channelIndex = 0; channelIndex < numChannels; channelIndex++) {
      var gaps = this._timeKeeper.getChannelGaps(channelIndex);
      for (const gap of gaps) {
        areaDataset.push({
          color: "#ff6969",
          startFrame: gap.globalStartFrame,
          endFrame: gap.globalEndFrame
        });
        console.log(`gap: ${gap.globalStartFrame} ${gap.globalEndFrame}`)
      }
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

    if (this._zoomTransform != null) {
      this._mainX.range([0, this._mainWidth].map(d => this._zoomTransform.applyX(d)));
    }

    var mainY = d3.scaleLinear()
      .domain([0, 1.0])
      .range([0, -this._mainStep]);

    // #TODO This is clunky and has no smooth transition, but it works for our application
    //       Potentially worth revisiting in the future and updating the dataset directly
    //       using the traditional d3 enter/update/exit paradigm.
    this._mainSvg.selectAll('*').remove();

    if (this.inFrameDisplayMode()) {
      var xAxis = g => g
        .attr("transform", `translate(0,${this._mainMargin.top + this._mainStep})`)
        .call(d3.axisBottom(this._mainX).ticks().tickSizeOuter(0).tickFormat(d3.format("d")))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick").filter(d => this._mainX(d) < this._mainMargin.left * 2 || this._mainX(d) >= this._mainWidth - this._mainMargin.right * 2).remove());
    }
    else if (this.inRelativeTimeDisplayMode()) {
      var xAxis = g => g
        .attr("transform", `translate(0,${this._mainMargin.top + this._mainStep})`)
        .call(d3.axisBottom(this._mainX).ticks().tickSizeOuter(0).tickFormat(d => {
          return this._createRelativeTimeString(d);
        }))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick").filter(d => this._mainX(d) < this._mainMargin.left * 2 || this._mainX(d) >= this._mainWidth - this._mainMargin.right * 2).remove());
    }
    else if (this.inUTCDisplayMode()) {
      var xAxis = g => g
        .attr("transform", `translate(0,${this._mainMargin.top + this._mainStep})`)
        .call(d3.axisBottom(this._mainX).ticks().tickSizeOuter(0).tickFormat(d => {
          return this._createUTCString(d ,"time");
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
        .attr("class", "videoSegmentHighlights")
        .attr("transform", (d, i) => `translate(0,${i * (this._mainStep + this._mainStepPad) + this._mainMargin.top})`)
        .selectAll("rect")
        .data(areaDataset)
        .join("rect")
          .attr("fill", d => d.color)
          .attr("x", d => this._mainX(d.startFrame))
          .attr("y", mainY(0))
          .attr("width", d => {
            const newStart = Math.max(0,Math.round(this._mainX.invert(0)));
            const newEnd = Math.min(this._maxFrame,Math.round(this._mainX.invert(this._mainWidth)));
            var width = ((d.endFrame - d.startFrame) / (newEnd - newStart)) * this._mainWidth;
            if (d.endFrame < newStart || d.startFrame > newEnd) {
              width = 0;
            }
            return width;
          })
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

    this._zoom = d3.zoom()
      .scaleExtent([1, 20])
      .translateExtent([[0, 0], [this._mainWidth, this._mainHeight]])
      .on("zoom", function (event) {
        that._zoomTransform = event.transform;
        that._mainX.range([0, that._mainWidth].map(d => event.transform.applyX(d)));
        that._xAxisG.call(that._xAxis);

        const newStart = Math.max(0,Math.round(that._mainX.invert(0)));
        const newEnd = Math.min(that._maxFrame,Math.round(that._mainX.invert(that._mainWidth)));
        that._mainSvg
          .selectAll(".videoSegmentHighlights rect")
          .attr("x", d => {
            return that._mainX(d.startFrame);
          })
          .attr("width", d => {
            var width = ((d.endFrame - d.startFrame) / (newEnd - newStart)) * that._mainWidth;
            if (d.endFrame < newStart || d.startFrame > newEnd) {
              width = 0;
            }
            return width;
          });

        console.log(`new x-axis: ${that._mainX.invert(0)} ${that._mainX.invert(that._mainWidth)}`);
        that.dispatchEvent(new CustomEvent("newFrameRange", {
          detail: {
            start: newStart,
            end: newEnd
          }
        }));
      });

    if (this._hoverFrame != null) {
      this._mainFrameLine
        .attr("opacity", "1.0")
        .attr("x1", this._mainX(this._hoverFrame))
        .attr("x2", this._mainX(this._hoverFrame))
        .attr("y1", -this._mainStep - this._mainMargin.bottom - 3)
        .attr("y2", this._mainHeight);

        this._hoverFrameText.attr("opacity", "1.0");
        this._hoverFrameTextBackground.attr("opacity", "1.0");

        if (this.inFrameDisplayMode()) {
          this._hoverFrameText.text(this._hoverFrame);
        }
        else if (this.inRelativeTimeDisplayMode()) {
          this._hoverFrameText.text(this._createRelativeTimeString(this._hoverFrame));
        }
        else if (this.inUTCDisplayMode()) {
          this._hoverFrameText.text(this._createUTCString(this._hoverFrame));
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

        if (that.inFrameDisplayMode()) {
          that._hoverFrameText.text(currentFrame);
        }
        else if (that.inRelativeTimeDisplayMode()) {
          that._hoverFrameText.text(that._createRelativeTimeString(currentFrame));
        }
        else if (that.inUTCDisplayMode()) {
          that._hoverFrameText.text(that._createUTCString(currentFrame));
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
    this.endpointData.end.redrawButtonActive = false;
  }

  _displayNewWindow(newStartFrame) {

    if (!this._timeKeeperInitialized) {
      return;
    }

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
    this._loadDiv.style.visibility = "visible";

    //this._colorDiv.classList.add("new-window");

    this.endpointData.start.globalFrame.textContent = `Start: ${this._newWindowStart}`;
    this.endpointData.end.globalFrame.textContent = `End: ${this._newWindowEnd}`;

    this.endpointData.start.globalTime.textContent = `Start: ${this._createRelativeTimeString(this._newWindowStart)}`;
    this.endpointData.end.globalTime.textContent = `End: ${this._createRelativeTimeString(this._newWindowEnd)}`;

    this.endpointData.start.globalTime.textContent = `Start: ${this._createUTCString(this._newWindowStart)}`;
    this.endpointData.end.globalTime.textContent = `End: ${this._createUTCString(this._newWindowEnd)}`;

    this.redraw();
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

  /**
   * Force a redraw of the timeline
   */
  redraw() {
    this._updateSvgData();
  }

  showFrameHover(frame) {
    this._hoverFrame = frame;
    this.redraw();
  }

  hideFrameHover() {
    this._hoverFrame = null;
    this.redraw();
  }

  createPlayWindowControls(parentDiv) {

    this.endpointData = {start: {}, end: {}};

    this._controlsDiv = document.createElement("div");
    this._controlsDiv.setAttribute("class", "annotation-canvas-overlay-menu d-flex flex-column rounded-1");
    this._controlsDiv.style.display = "none";
    parentDiv.appendChild(this._controlsDiv);

    var title = document.createElement("div");
    title.setAttribute("class", "annotation-canvas-overlay-menu-back f3 text-gray text-semibold text-uppercase d-flex flex-grow px-2 py-2 flex-items-center");
    title.textContent = "Adjust Play Window";
    this._controlsDiv.appendChild(title);

    var wrapperDiv = document.createElement("div");
    wrapperDiv.setAttribute("class", "px-2 py-1 d-flex flex-grow flex-items-center");
    this._controlsDiv.appendChild(wrapperDiv);

    var btn = document.createElement("small-svg-button");
    btn.init(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
      "Set Start Of Play Window",
      "play-window-set-start"
    );
    wrapperDiv.appendChild(btn);
    btn.addEventListener("click", () => {
      if (!this.endpointData.start.redrawButtonActive) {
        this._resetSelectMode();
        this._selectMode = "segmentStart";
        this.endpointData.start.redrawButtonActive = true;
        this.redraw();
      }
      else {
        this._resetSelectMode();
        this.redraw();
      }
    });
    this.endpointData.start.redrawButton = btn;

    var label = document.createElement("span");
    label.setAttribute("class", "text-gray f3 text-semibold text-uppercase px-1");
    label.textContent = "Start 0";
    wrapperDiv.appendChild(label);
    this.endpointData.start.globalFrame = label;

    var label = document.createElement("span");
    label.setAttribute("class", "text-gray f3 text-semibold text-uppercase px-1");
    label.textContent = "Start 0";
    wrapperDiv.appendChild(label);
    this.endpointData.start.globalTime = label;
    label.style.hidden = true;

    var label = document.createElement("span");
    label.setAttribute("class", "text-gray f3 text-semibold text-uppercase px-1");
    label.textContent = "Start 0";
    wrapperDiv.appendChild(label);
    this.endpointData.start.utc = label;
    label.style.hidden = true;

    var wrapperDiv = document.createElement("div");
    wrapperDiv.setAttribute("class", "px-2 py-1 d-flex flex-grow flex-items-center");
    this._controlsDiv.appendChild(wrapperDiv);

    var btn = document.createElement("small-svg-button");
    btn.init(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
      "Set End Of Play Window",
      "play-window-set-end"
    );
    wrapperDiv.appendChild(btn);
    btn.addEventListener("click", () => {
      if (!this.endpointData.end.redrawButtonActive) {
        this._resetSelectMode();
        this._selectMode = "segmentEnd";
        this.endpointData.end.redrawButtonActive = true;
        this.redraw();
      }
      else {
        this._resetSelectMode();
        this.redraw();
      }
    });
    this.endpointData.end.redrawButton = btn;

    var label = document.createElement("span");
    label.setAttribute("class", "text-gray f3 text-semibold text-uppercase px-1");
    label.textContent = "End 0";
    wrapperDiv.appendChild(label);
    this.endpointData.end.globalFrame = label;

    var label = document.createElement("span");
    label.setAttribute("class", "text-gray f3 text-semibold text-uppercase px-1");
    label.textContent = "End 0";
    wrapperDiv.appendChild(label);
    this.endpointData.end.globalTime = label;
    label.style.hidden = true;

    var label = document.createElement("span");
    label.setAttribute("class", "text-gray f3 text-semibold text-uppercase px-1");
    label.textContent = "End 0";
    wrapperDiv.appendChild(label);
    this.endpointData.end.utc = label;
    label.style.hidden = true;

    var wrapperDiv = document.createElement("div");
    wrapperDiv.setAttribute("class", "px-2 py-1 d-flex flex-grow flex-items-center flex-justify-center");
    this._controlsDiv.appendChild(wrapperDiv);

    var label = document.createElement("span");
    label.setAttribute("class", "text-gray f3 text-semibold text-uppercase px-1");
    label.textContent = "Shift";
    wrapperDiv.appendChild(label);

    var btn = document.createElement("small-svg-button");
    btn.init(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
      "Shift Play Window Left",
      "play-window-shift-left"
    );
    wrapperDiv.appendChild(btn);
    btn.addEventListener("click", () => {
      this._displayNewWindow(this._newWindowStart - this._newWindowShiftSize);
      btn.blur();
    });

    var btn = document.createElement("small-svg-button");
    btn.init(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
      "Shift Play Window Right",
      "play-window-shift-right"
    );
    wrapperDiv.appendChild(btn);
    btn.addEventListener("click", () => {
      this._displayNewWindow(this._newWindowStart + this._newWindowShiftSize);
      btn.blur();
    });

    var wrapperDiv = document.createElement("div");
    wrapperDiv.setAttribute("class", "d-flex flex-grow flex-items-center flex-justify-center");
    this._controlsDiv.appendChild(wrapperDiv);

    var loadDiv = document.createElement("div");
    loadDiv.setAttribute("class", "annotation-canvas-overlay-menu-option d-flex flex-items-center flex-justify-center px-2 py-1 flex-grow");
    loadDiv.style.visibility = "hidden";
    this._loadDiv = loadDiv;
    wrapperDiv.appendChild(loadDiv);

    var label = document.createElement("span");
    label.setAttribute("class", "text-white f3 text-semibold text-uppercase");
    label.textContent = "Load Play Window";
    this._loadDiv.appendChild(label);

    var svgIcon = document.createElement("span");
    svgIcon.setAttribute("class", "d-flex px-2");
    svgIcon.innerHTML =  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
    this._loadDiv.appendChild(svgIcon);

    wrapperDiv.addEventListener("click", () => {
      console.log(`Play window: ${this._newWindowStart} ${this._newWindowEnd}`);
      this.dispatchEvent(new CustomEvent("setPlayWindow", {
        composed: true,
        detail: {
          newWindowStart: this._newWindowStart
        }
      }));
    });
  }

  displayPlayWindowControls(top, left) {
    this._controlsDiv.style.top = `${top - 200}px`;
    this._controlsDiv.style.left = `${left - 80}px`;
    this._controlsDiv.style.display = "flex";
  }

  playWindowControlsVisible() {
    return this._controlsDiv.style.display != "none";
  }

  hidePlayWindowControls() {
    this._controlsDiv.style.display = "none";
  }

  /**
   * Force a redraw of the timeline and update the controls
   */
   redraw() {

    if (!this._timeKeeperInitialized) {
      return;
    }

    this.endpointData.start.globalFrame.textContent = `Start: ${this._windowStartFrame}`;
    this.endpointData.end.globalFrame.textContent = `End: ${this._windowEndFrame}`;

    this.endpointData.start.globalTime.textContent = `Start: ${this._createRelativeTimeString(this._windowStartFrame)}`;
    this.endpointData.end.globalTime.textContent = `End: ${this._createRelativeTimeString(this._windowEndFrame)}`;

    this.endpointData.start.utc.textContent = `Start: ${this._createUTCString(this._windowStartFrame)}`;
    this.endpointData.end.utc.textContent = `End: ${this._createUTCString(this._windowEndFrame)}`;

    if (this.inFrameDisplayMode()) {
      this.endpointData.start.globalFrame.hidden = false;
      this.endpointData.start.globalTime.hidden = true;
      this.endpointData.start.utc.hidden = true;
      this.endpointData.end.globalFrame.hidden = false;
      this.endpointData.end.globalTime.hidden = true;
      this.endpointData.end.utc.hidden = true;
    }
    else if (this.inRelativeTimeDisplayMode()) {
      this.endpointData.start.globalFrame.hidden = true;
      this.endpointData.start.globalTime.hidden = false;
      this.endpointData.start.utc.hidden = true;
      this.endpointData.end.globalFrame.hidden = true;
      this.endpointData.end.globalTime.hidden = false;
      this.endpointData.end.utc.hidden = true;
    }
    else if (this.inUTCDisplayMode()) {
      this.endpointData.start.globalFrame.hidden = true;
      this.endpointData.start.globalTime.hidden = true;
      this.endpointData.start.utc.hidden = false;
      this.endpointData.end.globalFrame.hidden = true;
      this.endpointData.end.globalTime.hidden = true;
      this.endpointData.end.utc.hidden = false;
    }
    this._updateSvgData();
  }

  timeKeeperInitialized() {
    this._timeKeeperInitialized = true;
    this._minFrame = 0;
    this._maxFrame = this._timeKeeper.getLastGlobalFrame();
  }

  /**
   * @param {integer} minFrame
   * @param {integer} maxFrame
   */
  init(minFrame, maxFrame) {
    this._windowStartFrame = minFrame;
    this._windowEndFrame = maxFrame;
    this._windowDuration = maxFrame - minFrame + 1
    this._maxWindowEndFrame = this._timeKeeper.getLastGlobalFrame() - this._windowDuration;

    this._showNewWindow = false;
    this._loadDiv.style.visibility = "hidden";
    this._newWindowStart = this._windowStartFrame;
    this._newWindowEnd = this._windowEndFrame;
    this._newWindowShiftSize = Math.floor((this._windowEndFrame - this._windowStartFrame)/2);

    this._hoverFrame = null;
    this._zoomTransform = null;

    this._resetSelectMode();
    this.redraw();
  }
}

customElements.define("video-segment-selector", VideoSegmentSelector);