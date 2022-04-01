import { TatorElement } from "../components/tator-element.js";
import { Utilities } from "../util/utilities.js";
import { guiFPS } from "../annotator/video.js";
import { RATE_CUTOFF_FOR_ON_DEMAND } from "../annotator/video.js";

/**
 * #TODO
 * Allow URL parameters
 */
export class AnnotationPlayerExperimental extends TatorElement {
  constructor() {
    super();

    const playerDiv = document.createElement("div");
    playerDiv.setAttribute("class", "annotation__video-player d-flex flex-column rounded-bottom-2");
    this._shadow.appendChild(playerDiv);

    this._video = document.createElement("video-canvas");
    this._video.domParents.push({"object":this});
    playerDiv.appendChild(this._video);
    this._video.stretch = true;

    const div = document.createElement("div");
    div.setAttribute("class", "video__controls d-flex flex-items-center flex-justify-between px-4");
    playerDiv.appendChild(div);
    this._controls = div;

    const playButtons = document.createElement("div");
    playButtons.setAttribute("class", "d-flex flex-items-center");
    div.appendChild(playButtons);

    const rewind = document.createElement("rewind-button");
    playButtons.appendChild(rewind);
    this._rewind = rewind;

    const play = document.createElement("play-button");
    this._play = play;
    this._play.setAttribute("is-paused", "");
    playButtons.appendChild(this._play);

    const fastForward = document.createElement("fast-forward-button");
    playButtons.appendChild(fastForward);
    this._fastForward = fastForward;

    const settingsDiv = document.createElement("div");
    settingsDiv.setAttribute("class", "d-flex flex-items-center");
    div.appendChild(settingsDiv);

    this._timelineControlsDiv = document.createElement("div");
    this._timelineControlsDiv.setAttribute("class", "video-timeline-control d-flex flex-row flex-items-center flex-justify-between rounded-1");
    this._timelineControlsDiv.style.display = "none";
    this._shadow.appendChild(this._timelineControlsDiv);

    this._timelineZoomButtons = {
      panLeft: null,
      panRight: null,
      zoomIn: null,
      zoomOut: null,
      reset: null
    }
    var btn = document.createElement("small-svg-button");
    btn.init(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
      "Pan Timeline Left",
      "pan-timeline-left-btn"
    );
    this._timelineControlsDiv.appendChild(btn);
    this._timelineZoomButtons.panLeft = btn;
    btn.addEventListener("click", () => {
      if (this._videoMode == "play") {
        this._videoTimeline.panLeft();
      }
      else {
        this._videoSegmentSelector.panLeft();
      }
    });

    var btn = document.createElement("small-svg-button");
    btn.init(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
      "Pan Timeline Right",
      "pan-timeline-right-btn"
    );
    this._timelineControlsDiv.appendChild(btn);
    this._timelineZoomButtons.panRight = btn;
    btn.addEventListener("click", () => {
      if (this._videoMode == "play") {
        this._videoTimeline.panRight();
      }
      else {
        this._videoSegmentSelector.panRight();
      }
    });

    var btn = document.createElement("small-svg-button");
    btn.init(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`,
      "Zoom Timeline In",
      "zoom-timeline-in-btn"
    );
    this._timelineControlsDiv.appendChild(btn);
    this._timelineZoomButtons.zoomIn = btn;
    btn.addEventListener("click", () => {
      if (this._videoMode == "play") {
        this._videoTimeline.zoomIn();
      }
      else {
        this._videoSegmentSelector.zoomIn();
      }
    });

    var btn = document.createElement("small-svg-button");
    btn.init(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`,
      "Zoom Timeline Out",
      "zoom-timeline-out-btn"
    );
    this._timelineControlsDiv.appendChild(btn);
    this._timelineZoomButtons.zoomOut = btn;
    btn.addEventListener("click", () => {
      if (this._videoMode == "play") {
        this._videoTimeline.zoomOut();
      }
      else {
        this._videoSegmentSelector.zoomOut();
      }
    });

    var btn = document.createElement("small-svg-button");
    btn.init(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`,
      "Reset Timeline",
      "reset-timeline-btn"
    );
    this._timelineControlsDiv.appendChild(btn);
    this._timelineZoomButtons.reset = btn;
    btn.addEventListener("click", () => {
      if (this._videoMode == "play") {
        this._videoTimeline.resetZoom();
      }
      else {
        this._videoSegmentSelector.resetZoom();
      }
    });

    this._frameTimeButton = document.createElement("frame-time-button");
    this._frameTimeButton.addEventListener("time", () => {
      this._videoTimeline.setDisplayMode("relativeTime");
      this._videoSegmentSelector.setDisplayMode("relativeTime");
    });

    this._frameTimeButton.addEventListener("frame", () => {
      this._videoTimeline.setDisplayMode("frame");
      this._videoSegmentSelector.setDisplayMode("frame");
    });

    this._timelineControlsDiv.appendChild(this._frameTimeButton);

    this._scrubControl = document.createElement("scrub-control");
    settingsDiv.appendChild(this._scrubControl);

    var btn = document.createElement("small-svg-button");
    btn.init(
      `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`,
      "Video Timeline Controls",
      "video-timeline-controls-btn"
    );
    btn._button.classList.remove("px-2");
    settingsDiv.appendChild(btn);
    this._videoTimelineControlsBtn = btn;
    btn.addEventListener("click", () => {
      btn.blur();
      var pos = this._videoTimelineControlsBtn.getBoundingClientRect();
      this._timelineControlsDiv.style.top = `${pos.top - 60}px`;
      this._timelineControlsDiv.style.left = `${pos.left - 115}px`;
      if (this._timelineControlsDiv.style.display == "flex") {
        this._timelineControlsDiv.style.display = "none";
      }
      else {
        this._timelineControlsDiv.style.display = "flex";
        this._videoSegmentSelector.hidePlayWindowControls();
      }
    });

    var btn = document.createElement("small-svg-button");
    btn.init(
      `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="no-fill"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>`,
      "Video Timeline Controls",
      "video-timeline-controls-btn"
    );
    btn._button.classList.remove("px-2");
    btn.setAttribute("class", "mr-6");
    settingsDiv.appendChild(btn);
    this._videoPlayWindow = btn;
    btn.addEventListener("click", () => {
      btn.blur();
      this._timelineControlsDiv.style.display = "none";
      if (this._videoMode == "play") {
        this._setToSummaryMode();
      }
      var pos = this._videoPlayWindow.getBoundingClientRect();
      this._videoSegmentSelector.togglePlayWindowControls(pos.top, pos.left);
    });

    this._rateControl = document.createElement("rate-control");
    settingsDiv.appendChild(this._rateControl);

    this._qualityControl = document.createElement("quality-control");
    settingsDiv.appendChild(this._qualityControl);

    this._timelineDiv = document.createElement("div");
    this._timelineDiv.setAttribute("class", "scrub__bar d-flex flex-items-center flex-grow px-4");
    playerDiv.appendChild(this._timelineDiv);

    const timeDiv = document.createElement("div");
    timeDiv.setAttribute("class", "d-flex flex-items-center flex-justify-between");
    playButtons.appendChild(timeDiv);

    this._currentTimeInput = document.createElement("input");
    this._currentTimeInput.setAttribute("class", "form-control input-sm1 f2 text-center");
    this._currentTimeInput.setAttribute("type", "text");
    this._currentTimeInput.style.display = "none";
    this._currentTimeInput.style.width = "100px";
    playButtons.appendChild(this._currentTimeInput);

    this._currentTimeText = document.createElement("div");
    this._currentTimeText.textContent = "0:00";
    this._currentTimeText.style.width = "35px";
    playButtons.appendChild(this._currentTimeText);

    this._totalTime = document.createElement("div");
    this._totalTime.setAttribute("class", "px-2 text-gray");
    this._totalTime.textContent = "/ 0:00";
    playButtons.appendChild(this._totalTime);

    this._timelineMore = document.createElement("entity-more");
    this._timelineMore.style.display = "block";
    this._timelineDiv.appendChild(this._timelineMore);

    var outerDiv = document.createElement("div");
    outerDiv.style.width = "100%";
    var seekDiv = document.createElement("div");
    this._slider = document.createElement("seek-bar-experimental");
    seekDiv.appendChild(this._slider);
    outerDiv.appendChild(seekDiv);

    var innerDiv = document.createElement("div");
    this._videoTimeline = document.createElement("video-timeline");
    innerDiv.appendChild(this._videoTimeline);
    this._videoSegmentSelector = document.createElement("video-segment-selector");
    this._videoSegmentSelector.hidden = true;
    innerDiv.appendChild(this._videoSegmentSelector);
    outerDiv.appendChild(innerDiv);
    this._timelineDiv.appendChild(outerDiv);

    var innerDiv = document.createElement("div");
    this._entityTimeline = document.createElement("entity-timeline");
    this._entityTimeline.rangeInput = this._slider;
    innerDiv.appendChild(this._entityTimeline);
    outerDiv.appendChild(innerDiv);
    this._timelineDiv.appendChild(outerDiv);

    const frameDiv = document.createElement("div");
    frameDiv.setAttribute("class", "d-flex flex-items-center flex-justify-between");
    playButtons.appendChild(frameDiv);

    const framePrev = document.createElement("frame-prev");
    frameDiv.appendChild(framePrev);

    const currentFrameWrapper = document.createElement("div");
    frameDiv.appendChild(currentFrameWrapper);

    this._currentFrameInput = document.createElement("input");
    this._currentFrameInput.setAttribute("class", "form-control input-sm1 f2 text-center");
    this._currentFrameInput.setAttribute("type", "text");
    this._currentFrameInput.setAttribute("id", "frame_num_ctrl");
    this._currentFrameInput.style.display = "none";
    this._currentFrameInput.style.width = "100px";
    frameDiv.appendChild(this._currentFrameInput);

    this._currentFrameText = document.createElement("div");
    this._currentFrameText.setAttribute("id", "frame_num_display");
    this._currentFrameText.setAttribute("class", "f2 text-center");
    this._currentFrameText.textContent = "0";
    this._currentFrameText.style.minWidth = "15px";
    currentFrameWrapper.appendChild(this._currentFrameText);

    const frameNext = document.createElement("frame-next");
    frameDiv.appendChild(frameNext);

    this._volume_control = document.createElement("volume-control");
    settingsDiv.appendChild(this._volume_control);
    this._volume_control.addEventListener("volumeChange", (evt) => {
      this._video.setVolume(evt.detail.volume);
    });
    const fullscreen = document.createElement("video-fullscreen");
    settingsDiv.appendChild(fullscreen);

    this._shortcutsDisabled = false;

    this._scrubInterval = 1000.0/Math.min(guiFPS,30);
    this._lastScrub = Date.now();
    this._rate = 1;

     // Magic number matching standard header + footer
     // #TODO This should be re-thought and more flexible initially
    this._headerFooterPad = 100; // Another magic number based on the header and padding below controls footer
    this._videoHeightPadObject = {height: 250};

    const searchParams = new URLSearchParams(window.location.search);
    this._quality = 720;
    this._seekQuality = null;
    this._scrubQuality = null;
    this._allowSafeMode = true;
    if (searchParams.has("playQuality")) {
      this._quality = Number(searchParams.get("playQuality"));
    }
    if (searchParams.has("seekQuality")) {
      this._seekQuality = Number(searchParams.get("seekQuality"));
    }
    if (searchParams.has("scrubQuality")) {
      this._scrubQuality = Number(searchParams.get("scrubQuality"));
    }
    if (searchParams.has("safeMode")) {
      this._allowSafeMode = Number(searchParams.get("safeMode")) == 1;
    }

    this._videoMode = "play"; // play | summary

    window.addEventListener("resize", this._resizeHandler.bind(this));

    /**
     * Video event listeners
     */

    this._video.addEventListener("bufferLoaded", evt => {
      // #TODO This will be adjusted when there is a separate buffer for the summary vs. the play
      var percentComplete = evt.detail.percent_complete;
      if (this._videoMode == "play") {
        var globalFrame = Math.min(this._lastGlobalFrame, Math.round(this._lastGlobalFrame * percentComplete));
        if (this._playWindowInfo.globalStartFrame > globalFrame) {
          percentComplete = 0;
        }
        else {
          percentComplete = Math.min(globalFrame / this._playWindowInfo.globalEndFrame, 1);
        }
      }
      this._summaryLoadedPercentage = evt.detail.percent_complete;
      this._slider.onBufferLoaded(percentComplete);
    });

    this._video.addEventListener("onDemandDetail", evt => {
      this._video.setProgressBarPercentage(evt.detail.readyPercentage, true);
    });

    // When a seek is complete check to make sure the display all set
    this._video.addEventListener("seekComplete", evt => {
      clearTimeout(this._handleNotReadyTimeout)
      this._handleNotReadyTimeout = null;
      this.checkReady();
    });

    // When a playback is stalled, pause the video
    this._video.addEventListener("playbackStalled", () => {
      Utilities.warningAlert("Video playback stalled.");
      this.pause();
    });

    this._video.addEventListener("rateChange", () => {
      if (this.is_paused()) {
        this._video.onDemandDownloadPrefetch();
        this.checkReady();
      }
    });

    this._video.addEventListener("canvasResized", () => {
      this._videoTimeline.redraw();
      this._entityTimeline.redraw();
    });

    this._video.addEventListener("frameChange", evt => {
      const frame = evt.detail.frame;
      const time = this._frameToTime(frame);
      this._currentTimeText.textContent = time;
      this._currentFrameText.textContent = frame;
      this._currentTimeText.style.width = 10 * (time.length - 1) + 5 + "px";
      this._currentFrameText.style.width = (15 * String(frame).length) + "px";
      this._setTimeControlStyle();
      this._slider.value = frame;
    });

    this._video.addEventListener("playbackEnded", () => {
      this.pause();
    });

    this._video.addEventListener("safeMode", () => {
      this.safeMode();
    });

    this._video.addEventListener("playbackReady", () => {
      if (this.is_paused() && this._videoMode == "play") {
        if(this._frameInPlayWindow(this._currentGlobalFrame())) {
          this._video.setProgressBarPercentage(100);
          this._video.toggleProgressBar(false);
          this._play._button.removeAttribute("disabled");
          this._rewind.removeAttribute("disabled")
          this._fastForward.removeAttribute("disabled");
          this._play.removeAttribute("tooltip");
        }
        else {
          this._play._button.setAttribute("disabled","");
          // Use some spaces because the tooltip z-index is wrong
          this._play.setAttribute("tooltip", "    Not in play window");
          this._rewind.setAttribute("disabled","")
          this._fastForward.setAttribute("disabled","");
        }
      }
    });

    /**
     * Play controls event listeners
     */

    this._timelineMore.addEventListener("click", () => {
      this._displayTimelineLabels = !this._displayTimelineLabels;
      this._entityTimeline.showFocus(this._displayTimelineLabels);
      this._videoHeightPadObject.height = this._headerFooterPad + this._controls.offsetHeight + this._timelineDiv.offsetHeight;
      window.dispatchEvent(new Event("resize"));
    });

    play.addEventListener("click", () => {
      if (this.is_paused()) {
        this.play();
      }
      else {
        this.pause();
      }
    });

    rewind.addEventListener("click", () => {
      this.playBackwards();
    });

    fastForward.addEventListener("click", () => {
      this._video.pause();
      this._video.rateChange(2 * this._rate);
      if (this._video.play())
      {
        this.dispatchEvent(new Event("playing", {composed: true}));
        play.removeAttribute("is-paused");
      }
    });

    framePrev.addEventListener("click", () => {
      if (this.is_paused() == false) {
        this.dispatchEvent(new Event("paused", {composed: true}));
        fastForward.removeAttribute("disabled");
        rewind.removeAttribute("disabled");
        this._video.pause().then(() => {
          this._video.back();
        });
      }
      else {
        this._video.back();
      }
    });

    frameNext.addEventListener("click", () => {
      if (this.is_paused() == false) {
        this.dispatchEvent(new Event("paused", {composed: true}));
        fastForward.removeAttribute("disabled");
        rewind.removeAttribute("disabled");
        this._video.pause().then(() => {
          this._video.advance();
        });
      }
      else {
        this._video.advance();
      }
    });

    this._currentFrameInput.addEventListener("focus", () => {
      document.body.classList.add("shortcuts-disabled");
    });

    this._currentFrameInput.addEventListener("change", () => {
      this._currentFrameInput.blur(); // Lose focus to invoke the blur event
    });

    this._currentFrameInput.addEventListener("blur", () => {
      document.body.classList.remove("shortcuts-disabled");
      this._currentFrameText.style.display = "block";
      this._currentFrameInput.style.display = "none";
      this.processFrameInput();
    });

    this._currentFrameText.addEventListener("click", () => {
      this._currentFrameInput.style.display = "block";
      this._currentFrameInput.focus();
      this._currentFrameText.style.display = "none";
    });

    this._currentTimeInput.addEventListener("focus", () => {
      document.body.classList.add("shortcuts-disabled");
    });

    this._currentTimeInput.addEventListener("change", () => {
      this._currentTimeInput.blur(); // Lose focus to invoke the blur event
    });

    this._currentTimeInput.addEventListener("blur", () => {
      document.body.classList.remove("shortcuts-disabled");
      this._currentTimeText.style.display = "block";
      this._currentTimeInput.style.display = "none";
      this.processTimeInput();
    });

    this._currentTimeText.addEventListener("click", () => {
      this._currentTimeInput.style.display = "block";
      this._currentTimeInput.focus();
      this._currentTimeText.style.display = "none";
    });

    /**
     * Seek/timeline event listeners
     */

    this._videoSegmentSelector.addEventListener("setPlayWindow", evt => {
      this._setPlayWindow(evt.detail.newWindowStart);
      this._setToPlayMode();
    });

    this._videoSegmentSelector.addEventListener("newFrameRange", evt => {
      this._slider.setAttribute("min", evt.detail.start);
      this._slider.setAttribute("max", evt.detail.end);
    });

    this._videoTimeline.addEventListener("input", evt => {
      this.handleSliderInput(evt);
    });

    this._videoTimeline.addEventListener("newFrameRange", evt => {
      this._slider.setAttribute("min", evt.detail.start);
      this._slider.setAttribute("max", evt.detail.end);
    });

    this._entityTimeline.addEventListener("selectFrame", evt => {
      this._slider.value = evt.detail.frame;
      this.handleSliderChange(evt);
    });

    this._entityTimeline.addEventListener("graphData", evt => {
      if (evt.detail.numericalData.length > 0 || evt.detail.stateData.length > 0) {
        this._timelineMore.style.display = "block";
      }
      else {
        this._timelineMore.style.display = "none";
      }
      this._videoHeightPadObject.height = this._headerFooterPad + this._controls.offsetHeight + this._timelineDiv.offsetHeight;
      window.dispatchEvent(new Event("resize"));
    });

    this._slider.addEventListener("mouseHover", evt => {
      if (this._videoMode == "play") {
        this._videoTimeline.showFrameHover(evt.detail.frame);
      }
      else {
        this._videoSegmentSelector.showFrameHover(evt.detail.frame);
      }
    });

    this._slider.addEventListener("mouseHoverOff", evt => {
      if (this._videoMode == "play") {
        this._videoTimeline.hideFrameHover();
      }
      else {
        this._videoSegmentSelector.hideFrameHover();
      }
    });

    this._slider.addEventListener("input", evt => {
      this.handleSliderInput(evt);
    });

    this._slider.addEventListener("change", evt => {
      this.handleSliderChange(evt);
    });

    this._scrubControl.addEventListener("play", () => {
      this._setToPlayMode();
    });

    this._scrubControl.addEventListener("summary", () => {
      this._setToSummaryMode();
    });

    /**
     * Video settings event listeners
     */

    fullscreen.addEventListener("click", evt => {
      if (fullscreen.hasAttribute("is-maximized")) {
        fullscreen.removeAttribute("is-maximized");
        playerDiv.classList.remove("is-full-screen");
        this.dispatchEvent(new Event("minimize", {composed: true}));
      } else {
        fullscreen.setAttribute("is-maximized", "");
        playerDiv.classList.add("is-full-screen");
        this.dispatchEvent(new Event("maximize", {composed: true}));
      }
      window.dispatchEvent(new Event("resize"));
    });

    this._qualityControl.addEventListener("setQuality", (evt) => {
      this.dispatchEvent(new CustomEvent("setPlayQuality",
      {
        composed: true,
        detail: {
          quality: evt.detail.quality
        }
      }));
    });

    /**
     * Keyboard shortcuts
     */

    document.addEventListener("keydown", evt => {

      if (this._shortcutsDisabled) {
        return;
      }

      if (document.body.classList.contains("shortcuts-disabled"))
      {
        return;
      }


      if (evt.ctrlKey && (evt.key == "m")) {
        fullscreen.click();
      }
      else if (evt.key == "t") {
        this.dispatchEvent(new Event("toggleTextOverlay", {composed: true}));
      }
      else if (evt.code == "Space")
      {
        evt.preventDefault();
        if (this._play._button.hasAttribute("disabled")) {
          return;
        }
        if (this.is_paused())
        {
          this.play();
        }
        else
        {
          this.pause();
        }
      }
      else if (evt.key == "r")
      {
        evt.preventDefault();
        if (this._play._button.hasAttribute("disabled")) {
          return;
        }
        if (this.is_paused())
        {
          this.playBackwards();
        }
      }
      else if (evt.key == 1) {
        if (!this._rateControl.hasAttribute("disabled")) {
          this._rateControl.setValue(1);
        }
      }
      else if (evt.key == 2) {
        if (!this._rateControl.hasAttribute("disabled")) {
          this._rateControl.setValue(2);
        }
      }
      else if (evt.key == 4) {
        if (!this._rateControl.hasAttribute("disabled")) {
          this._rateControl.setValue(4);
        }
      }
      else if (evt.key == 'ArrowUp' && evt.ctrlKey)
      {
        if (!this._rateControl.hasAttribute("disabled")) {
          const newIdx = this._rateControl.getIdx()+1;
          const newRate = this._rateControl.rateForIdx(newIdx);
          if (this._ratesAvailable == null || (newRate >= this._ratesAvailable.minimum && newRate <= this._ratesAvailable.maximum))
          {
            this._rateControl.setIdx(newIdx);
          }
        }
      }
      else if (evt.key == 'ArrowDown' && evt.ctrlKey)
      {
        if (!this._rateControl.hasAttribute("disabled")) {
          const newIdx = this._rateControl.getIdx()-1;
          const newRate = this._rateControl.rateForIdx(newIdx);
          if (this._ratesAvailable == null || (newRate >= this._ratesAvailable.minimum && newRate <= this._ratesAvailable.maximum))
          {
            this._rateControl.setIdx(newIdx);
          }
        }
      }
    });

    this._videoStatus = "paused"; // Possible values: playing | paused | scrubbing
  }

  static get observedAttributes() {
    return ["rate"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "rate":
        if (newValue >= 1) {
          this._rateControl.textContent = Math.round(newValue) + "x";
        } else {
          this._rateControl.textContent = Number(newValue).toFixed(2) + "x";
        }
        break;
    }
  }

  set quality(val) {
    this._qualityControl.quality = val;
  }

  set permission(val) {
    this._video.permission = val;
  }

  set undoBuffer(val) {
    this._video.undoBuffer = val;
  }

  set mediaInfo(val) {
    this._video.mediaInfo = val;
    this._mediaInfo = val;
    const dims = [val.width, val.height];
    this._fps = val.fps;
    this._totalTime.textContent = "/ " + this._frameToTime(val.num_frames);
    this._totalTime.style.width = 10 * (this._totalTime.textContent.length - 1) + 5 + "px";

    // Initialize the media segments and the current play window
    this._initializeMediaTimeline(this._mediaInfo);
    this._setPlayWindow(0);

    this._video.loadFromVideoObject(val, this.mediaType, this._quality, null, null, null, this._videoHeightPadObject, this._seekQuality, this._scrubQuality)
      .then(() => {
        if (this._video.allowSafeMode) {
          this._video.allowSafeMode = this._allowSafeMode;
        }
        else {
          this._allowSafeMode = false;
        }
        const seekInfo = this._video.getQuality("seek");
        const scrubInfo = this._video.getQuality("scrub");
        const playInfo = this._video.getQuality("play");

        this._setToPlayMode();

        this.dispatchEvent(new CustomEvent("defaultVideoSettings", {
          composed: true,
          detail: {
            seekQuality: seekInfo.quality,
            seekFPS: seekInfo.fps,
            scrubQuality: scrubInfo.quality,
            scrubFPS: scrubInfo.fps,
            playQuality: playInfo.quality,
            playFPS: playInfo.fps,
            focusedQuality: null,
            focusedFPS: null,
            dockedQuality: null,
            dockedFPS: null,
            allowSafeMode: this._allowSafeMode
          }
        }));

        this.dispatchEvent(new Event("canvasReady", {
          composed: true
        }));
      })
      .catch((err) => {
        console.error(err);
        this._video.displayErrorMessage(`Error occurred. Could not load media: ${val.id}`);
        this.dispatchEvent(new Event("videoInitError", {
          composed: true
        }));
      });
    if (this._video.audio != true)
    {
      // Hide volume on videos with no audio
      this._volume_control.style.display = "none";
    }
    this._volume_control.volume = this.mediaType['default_volume'];
    if (val.media_files && 'streaming' in val.media_files)
    {
      let quality_list = [];
      for (let media_file of val.media_files["streaming"])
      {
        quality_list.push(media_file.resolution[0]);
      }
      this._qualityControl.resolutions = quality_list;
      this._qualityControl.show();
    }
    else
    {
      this._qualityControl.hide();
    }
  }

  set annotationData(val) {
    this._video.annotationData = val;
    this._entityTimeline.annotationData = val;
  }


  _currentGlobalFrame() {
    // #TODO Update once we actually have true windowing
    return this._video.currentFrame();
  }

  /**
   *
   * @param {integer} frame
   * @returns {boolean}
   */
  _frameInPlayWindow(frame) {
    return frame <= this._playWindowInfo.globalEndFrame && frame >= this._playWindowInfo.globalStartFrame;
  }

  _setToSummaryMode() {
    this._videoMode = "summary";

    this._slider.setAttribute("min", 0);
    this._slider.setAttribute("max", this._lastGlobalFrame);
    this._slider.setStyle("blue-iris-range-div", "blue-iris-range-loaded");

    this._videoTimeline.style.display = "none";
    this._videoSegmentSelector.style.display = "block";

    this._videoTimeline.init(
      0,
      this._lastGlobalFrame,
      this._mediaInfo.fps);

    this._entityTimeline.init(
      0,
      this._lastGlobalFrame,
      this._mediaInfo.fps);

    this._setTimeControlStyle();
    this._scrubControl.setValue("Summary");
    this._qualityControl.setAttribute("disabled", "");
    this._rateControl.setAttribute("disabled", "");

    this._video.toggleProgressBar(false);
    this._playerDownloadDisabled = true;
    this._play._button.setAttribute("disabled", "");
    this._fastForward.setAttribute("disabled", "");
    this._rewind.setAttribute("disabled", "");

    this._videoSegmentSelector.init(
      this._lastGlobalFrame,
      this._playWindowInfo.globalStartFrame,
      this._playWindowInfo.globalEndFrame,
      this._mediaInfo.fps
    );

    this._videoTimeline.hidden = false;
    this._videoSegmentSelector.hidden = false;

    this._resizeWindow();
  }

  _setToPlayMode() {
    this._videoMode = "play";

    this._videoTimeline.style.display = "block";
    this._videoSegmentSelector.style.display = "none";

    this._videoTimeline.init(
      this._playWindowInfo.globalStartFrame,
      this._playWindowInfo.globalEndFrame,
      this._mediaInfo.fps);

    this._entityTimeline.init(
      this._playWindowInfo.globalStartFrame,
      this._playWindowInfo.globalEndFrame,
      this._mediaInfo.fps);

    this._slider.setAttribute("min", this._playWindowInfo.globalStartFrame);
    this._slider.setAttribute("max", this._playWindowInfo.globalEndFrame);
    this._slider.setStyle("range-div", "range-loaded");

    this._setTimeControlStyle();
    this._scrubControl.setValue("Play");
    this._qualityControl.removeAttribute("disabled");
    this._rateControl.removeAttribute("disabled");

    // Performing the checkReady function will force the playback buttons to re-enable
    // and the ondemand to redownload
    this._playerDownloadDisabled = false;
    this._video.setOnDemandPlaybackNotReady();
    if (this._frameInPlayWindow(this._currentGlobalFrame())) {
      this.handleNotReadyEvent(); // #TODO this might just be check ready + enable play
    }

    this._resizeWindow();
  }

  _resizeWindow() {
    this._videoHeightPadObject.height = this._headerFooterPad + this._controls.offsetHeight + this._timelineDiv.offsetHeight;
    window.dispatchEvent(new Event("resize"));
  }

  _resizeHandler() {
    this._timelineControlsDiv.style.display = "none";
    this._videoSegmentSelector.hidePlayWindowControls();
  }

  _setTimeControlStyle() {
    if (this._videoMode == "play") {
      if (!this._frameInPlayWindow(this._video.currentFrame())) {
        this._currentTimeText.classList.add("text-purple");
        this._currentFrameText.classList.add("text-purple");
      }
      else {
        this._currentTimeText.classList.remove("text-purple");
        this._currentFrameText.classList.remove("text-purple");
      }
    }
    else {
      this._currentTimeText.classList.remove("text-purple");
      this._currentFrameText.classList.remove("text-purple");
    }
  }

  /**
   * Creates the global timeline, creating an internal mapping of the media and global frame/time.
   * Call this when the media has been collected.
   *
   * #TODO This will likely change with the append logic. For now, this will just use a single
   *       video media and its num_frames
   *
   * This should be executed during media initialization so that other components of the
   * annotator can be initialized.
   *
   * @param {Tator.Media} initMedia
   * @postcondition this._playWindowInfo is set
   * @postcondition this._mediaMap is set
   */
  _initializeMediaTimeline(initMedia) {

    this._mediaMap = [];

    // #TODO Change this later to deal with the append logic
    var mediaList = [initMedia];

    // Create the map that is used to associate a global frame with media
    var globalFrame = 0;
    for (const media of mediaList) {
      var mapObject = {
        globalStartFrame: globalFrame,
        media: media
      };
      globalFrame += media.num_frames - 1;
      mapObject.globalEndFrame = globalFrame;
      globalFrame += 1;
    }
    this._lastGlobalFrame = globalFrame - 1;

    const windowSize = Math.floor(initMedia.num_frames / 5);
    this._playWindowInfo = {
      globalStartFrame: 0,
      globalEndFrame: windowSize - 1,
      windowSize: windowSize,
      fps: initMedia.fps
    };
  }

  /**
   * @param {integer} globalFrame
   * @returns Tator.Media
   */
  _getMedia(globalFrame) {
    for (const info of this._mediaMap) {
      if (globalFrame >= info.globalStartFrame && globalFrame <= info.globalEndFrame) {
        return info.media;
      }
    }
    console.error(`No matching mediaMap entry for global frame: ${globalFrame}`);
    return null;
  }

  /**
   * Play buffer window set using the provided global start frame. Will enforce windowSize.
   * @param {integer} globalStartFrame
   */
  _setPlayWindow(globalStartFrame) {
    if (globalStartFrame + this._playWindowInfo.windowSize > this._lastGlobalFrame) {
      this._playWindowInfo.globalStartFrame = this._lastGlobalFrame - this._playWindowInfo.windowSize + 1;
      this._playWindowInfo.globalEndFrame = this._lastGlobalFrame;
    }
    else {
      this._playWindowInfo.globalStartFrame = globalStartFrame;
      this._playWindowInfo.globalEndFrame = globalStartFrame + this._playWindowInfo.windowSize - 1
    }
  }

  /**
   * @returns {Object}
   */
  _getCurrentPlayWindow() {
    return this._playWindowInfo;
  }

  /**
   * Returns (hours):minutes:seconds string associated with the given frame number
   * @param {Integer} frame
   * @returns string hours:minutes:seconds returned if there's more than one hour
   */
  _frameToTime(frame) {
    const totalSeconds = frame / this._fps;
    const seconds = Math.floor(totalSeconds % 60);
    const secFormatted = ("0" + seconds).slice(-2);
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes < 60)
    {
      return minutes + ":" + secFormatted;
    }
    else
    {
      let hours = Math.floor(minutes / 60)
      const minFormatted = ("0" + Math.floor(minutes % 60)).slice(-2);
      return hours + ":" + minFormatted + ":" + secFormatted;
    }
  }

  _timeToFrame(minutes, seconds) {
    var frame = minutes * 60 * this._fps + seconds * this._fps + 1;
    return frame;
  }

  disableAutoDownloads(){
    this._playerDownloadDisabled = true;
    this._video.disableAutoDownloads();
  }

  enableShortcuts() {
    this._shortcutsDisabled = false;
    this._video.enableShortcuts();
  }

  disableShortcuts() {
    this._shortcutsDisabled = true;
    this._video.disableShortcuts();
  }

  enableQualityChange()
  {
    this._qualityControl.removeAttribute("disabled");
  }
  disableQualityChange()
  {
    this._qualityControl.setAttribute("disabled", "");
  }

  enableRateChange()
  {
    this._rateControl.removeAttribute("disabled");
  }
  disableRateChange()
  {
    this._rateControl.setAttribute("disabled", "");
  }

  /**
   * Callback used when user clicks on one of the seek bar sliders
   */
  handleSliderInput(evt) {
    // Along allow a scrub display as the user is going slow
    const now = Date.now();
    const frame = Number(evt.target.value);
    const waitOk = now - this._lastScrub > this._scrubInterval;
    if (waitOk) {

      this._videoStatus = "scrubbing";

      this._play.setAttribute("is-paused","");
      this._video.stopPlayerThread();
      this._video.shutdownOnDemandDownload();
      this._video.seekFrame(frame, this._video.drawFrame)
      .then(this._lastScrub = Date.now());
    }
  }

  /**
   * Callback used when user slides one of the seek bars
   */
  handleSliderChange(evt) {
    this._play.setAttribute("is-paused","");
    this.dispatchEvent(new Event("displayLoading", {composed: true}));
    // Only use the current frame to prevent glitches
    let frame = this._video.currentFrame();
    if (evt.detail)
    {
      frame = evt.detail.frame;
    }

    this._videoStatus = "scrubbing";

    this._video.stopPlayerThread();
    this._video.shutdownOnDemandDownload();

    // Use the hq buffer when the input is finalized
    this._video.seekFrame(frame, this._video.drawFrame, true).then(() => {
      this._lastScrub = Date.now()
      if (!this._playerDownloadDisabled) {
        this._video.onDemandDownloadPrefetch(frame);
      }
      this._videoStatus = "paused";
      this.checkReady();
      this.dispatchEvent(new Event("hideLoading", {composed: true}));
    }).catch((e) => {
      console.error(`"ERROR: ${e}`)
      throw e;
      this.dispatchEvent(new Event("hideLoading", {composed: true}));
    });
  }

  /**
   * Process the frame input text field and attempts to jump to that frame
   */
  processFrameInput() {

    this._videoStatus = "paused";

    var frame = parseInt(this._currentFrameInput.value);
    if (isNaN(frame)) {
      console.log("Provided invalid frame input: " + this._currentFrameInput.value);
      this._currentFrameInput.classList.add("has-border");
      this._currentFrameInput.classList.add("is-invalid");
      return;
    }

    const maxFrame = this._mediaInfo.num_frames - 1;
    if (frame > maxFrame - 1)  // #TODO Fix in the future once video.js has been sorted out.
    {
      frame = maxFrame - 1;
    }
    else if (frame < 0)
    {
      frame = 0;
    }

    this._currentFrameInput.classList.remove("has-border");
    this._currentFrameInput.classList.remove("is-invalid");
    this.goToFrame(frame).then(() => {
      this.checkReady();
    });
  }

  /**
   * Process the time input text field and attempts to jump to the corresponding frame
   */
  processTimeInput() {

    this._videoStatus = "paused";

    var timeTokens = this._currentTimeInput.value.split(":");
    if (timeTokens.length != 2)
    {
      console.log("Provided invalid time (minutes:seconds) expected: " + this._currentTimeInput.value);
      this._currentTimeInput.classList.add("has-border");
      this._currentTimeInput.classList.add("is-invalid");
      return;
    }

    var minutes = parseInt(timeTokens[0]);
    if (isNaN(minutes))
    {
      console.log("Provided invalid time (minutes:seconds) expected: " + this._currentTimeInput.value);
      this._currentTimeInput.classList.add("has-border");
      this._currentTimeInput.classList.add("is-invalid");
      return;
    }

    var seconds = parseInt(timeTokens[1]);
    if (isNaN(seconds))
    {
      console.log("Provided invalid time (minutes:seconds) expected: " + this._currentTimeInput.value);
      this._currentTimeInput.classList.add("has-border");
      this._currentTimeInput.classList.add("is-invalid");
      return;
    }

    var frame = this._timeToFrame(minutes, seconds);
    const maxFrame = this._mediaInfo.num_frames - 1;
    if (frame > maxFrame)
    {
      frame = maxFrame;
    }
    else if (frame < 0)
    {
      frame = 0;
    }

    this._currentTimeInput.classList.remove("has-border");
    this._currentTimeInput.classList.remove("is-invalid");
    this.goToFrame(frame).then(() => {
      this.checkReady();
    });
  }

  addDomParent(val)
  {
    this._video.domParents.push(val);
  }

  newMetadataItem(dtype, metaMode, objId) {
    this._video.style.cursor = "crosshair";
    this._video.newMetadataItem(dtype, metaMode, objId);
  }

  updateType(objDescription) {
    this._video.updateType(objDescription);
  }

  is_paused()
  {
    return this._play.hasAttribute("is-paused");
  }

  checkReady()
  {
    if (this._video.bufferDelayRequired() &&
      this._video._onDemandPlaybackReady != true &&
      this._frameInPlayWindow(this._currentGlobalFrame())) {
      this.handleNotReadyEvent();
    }
  }
  handleNotReadyEvent()
  {
    if (this._playerDownloadDisabled) {
      // Don't bother attempting to check if playback is ready if downloads have been disabled.
      return;
    }

    if (this._video.isInCompatibilityMode() == true)
    {
      // Compatibility videos are always ready to play.
      return;
    }

    if (this._handleNotReadyTimeout != null)
    {
      console.log("Already handling a not ready event");
      return;
    }

    this._video.setProgressBarPercentage(0);
    this._video.toggleProgressBar(true);
    this._play._button.setAttribute("disabled","");
    // Use some spaces because the tooltip z-index is wrong
    this._play.setAttribute("tooltip", "    Video is buffering");
    this._rewind.setAttribute("disabled","")
    this._fastForward.setAttribute("disabled","");

    const timeouts = [2000, 4000, 8000, 16000];
    var timeoutIndex = 0;
    var timeoutCounter = 0;
    const clock_check = 100;
    this._last_duration = this._video.playBufferDuration();

    let check_ready = (checkFrame) => {

      if (this._videoStatus == "scrubbing") {
        console.log(`Player status == scrubbing | Cancelling check_ready`);
        return;
      }
      if (this._videoStatus == "playing") {
        console.error(`Player status == playing | Cancelling check_ready`);
        return;
      }

      timeoutCounter += clock_check;

      this._handleNotReadyTimeout = null;
      let not_ready = false;
      if (checkFrame != this._video.currentFrame()) {
        console.log(`check_ready frame ${checkFrame} and current frame ${this._video.currentFrame()} do not match. restarting check_ready`)
        timeoutIndex = 0;
        timeoutCounter = 0;
        this._handleNotReadyTimeout = setTimeout(() => {
          this._handleNotReadyTimeout = null;
          check_ready(this._video.currentFrame())}, 100);
        return;
      }
      if (this._video._onDemandPlaybackReady != true)
      {
        not_ready = true;
        if (timeoutCounter == timeouts[timeoutIndex]) {
          timeoutCounter = 0;
          timeoutIndex += 1;
          console.log(`Video playback check - restart [Now: ${new Date().toISOString()}]`);
          this._video.onDemandDownloadPrefetch(-1);
        }
      }
      if (not_ready == true)
      {
        // Heal the buffer state if duration increases since the last time we looked
        if (this._video.playBufferDuration() > this._last_duration)
        {
          this._last_duration = this._video.playBufferDuration();
          timeoutIndex = 0;
        }
        // For this logic to work it is actually based off the worst case
        // number of clocks in a given timeout attempt.
        if (timeoutIndex < timeouts[timeouts.length-1]/clock_check) {
          //console.log(`Video playback check - Not ready: checking in ${timeouts[timeoutIndex]/1000} seconds [Now: ${new Date().toISOString()}]`);
          this._handleNotReadyTimeout = setTimeout(() => {
            this._handleNotReadyTimeout = null;
            check_ready(checkFrame);
          }, clock_check);
        }
        else {
          Utilities.warningAlert("Video player unable to reach ready state.", "#ff3e1d", false);
          console.error(`Video player unable to reach ready state`);
        }
      }
      if (not_ready == false)
      {
        this._video.seekFrame(this._video.currentFrame(), this._video.drawFrame, true, null, true).then(() => {
          console.log(`Video playback check - Ready [Now: ${new Date().toISOString()}]`);
          this._video.setProgressBarPercentage(100);
          this._video.toggleProgressBar(false);
          if (this._videoMode == "play") {
            this._play._button.removeAttribute("disabled");
            this._rewind.removeAttribute("disabled")
            this._fastForward.removeAttribute("disabled");
            this._play.removeAttribute("tooltip");
          }
        }).catch((e) => {
          console.log(e);
          console.log(`Video playback check - Ready [Now: ${new Date().toISOString()}] (not hq pause)`);
          this._video.setProgressBarPercentage(100);
          this._video.toggleProgressBar(false);
          if (this._videoMode == "play") {
            this._play._button.removeAttribute("disabled");
            this._rewind.removeAttribute("disabled")
            this._fastForward.removeAttribute("disabled");
            this._play.removeAttribute("tooltip");
          }
        });
      }
    };

    // We can be faster in single play mode
    this._handleNotReadyTimeout = setTimeout(check_ready(this._video.currentFrame()), 0);
  }

  play()
  {
    if (this._rate > RATE_CUTOFF_FOR_ON_DEMAND)
    {
      // Check to see if the video player can play at this rate
      // at the current frame. If not, inform the user.
      if (!this._video.canPlayRate(this._rate, this._video.currentFrame()))
      {
        window.alert("Please wait until this portion of the video has been downloaded. Playing at speeds greater than 4x require the video to be buffered.")
        return;
      }
    }
    this._ratesAvailable = this._video.playbackRatesAvailable();

    if (this._video.bufferDelayRequired() && this._video._onDemandPlaybackReady != true)
    {
      this.handleNotReadyEvent();
      return;
    }

    if (this._video.currentFrame() >= this._video._numFrames - 1) {
      this.pause();
      return;
    }

    this.dispatchEvent(new Event("playing", {composed: true}));
    this._fastForward.setAttribute("disabled", "");
    this._rewind.setAttribute("disabled", "");

    const paused = this.is_paused();
    if (paused) {
      this._video.rateChange(this._rate);
      if (this._video.play())
      {
        this._videoStatus = "playing";
        this._play.removeAttribute("is-paused");
      }
    }
  }

  playBackwards()
  {
    if (this._rate > RATE_CUTOFF_FOR_ON_DEMAND)
    {
      // Check to see if the video player can play at this rate
      // at the current frame. If not, inform the user.
      if (!this._video.canPlayRate(this._rate, this._video.currentFrame()))
      {
        window.alert("Please wait until this portion of the video has been downloaded. Playing at speeds greater than 4x require the video to be buffered.")
        return;
      }
    }
    this._ratesAvailable = this._video.playbackRatesAvailable();

    if (this._video.bufferDelayRequired() && this._video._onDemandPlaybackReady != true)
    {
      this.handleNotReadyEvent();
      return;
    }

    if (this._video.currentFrame() <= 0) {
      this.pause();
      return;
    }

    this.dispatchEvent(new Event("playing", {composed: true}));
    this._fastForward.setAttribute("disabled", "");
    this._rewind.setAttribute("disabled", "");

    const paused = this.is_paused();
    if (paused) {
      this._video.rateChange(this._rate);
      if (this._video.playBackwards())
      {
        this._videoStatus = "playing";
        this._play.removeAttribute("is-paused");
      }
    }
  }

  pause()
  {
    this._ratesAvailable = null;
    this.dispatchEvent(new Event("paused", {composed: true}));
    this._fastForward.removeAttribute("disabled");
    this._rewind.removeAttribute("disabled");

    const paused = this.is_paused();
    if (paused == false) {
      this._video.pause();
      this._play.setAttribute("is-paused", "")
    }
    this._videoStatus = "paused";
    this.checkReady();
  }

  refresh() {
    this._video.refresh();
  }

  defaultMode() {
    this._video.style.cursor = "default";
    this._video.defaultMode();
  }

  setRate(val) {
    this._rate = val;
    this._video.rateChange(this._rate);
  }

  setQuality(quality, buffer) {
    // For now reload the video
    if (this.is_paused())
    {
      this._video.setQuality(quality, buffer);
    }
    else
    {
      this.pause();
      this._video.setQuality(quality, buffer);
    }
    this._video.onDemandDownloadPrefetch(this._video.currentFrame());
    this._video.refresh(true);
  }

  zoomPlus() {
    let [x, y, width, height] = this._video._roi;
    width /= 2.0;
    height /= 2.0;
    x += width / 2.0;
    y += height / 2.0;
    this._video.setRoi(x, y, width, height);
    this._video._dirty = true;
    this._video.refresh();
  }

  zoomMinus() {
    let [x, y, width, height] = this._video._roi;
    width *= 2.0;
    height *= 2.0;
    x -= width / 4.0;
    y -= height / 4.0;
    width = Math.min(width, this._video._dims[0]);
    height = Math.min(height, this._video._dims[1]);
    x = Math.max(x, 0);
    y = Math.max(y, 0);
    this._video.setRoi(x, y, width, height);
    this._video._dirty = true;
    this._video.refresh();
  }

  zoomIn() {
    this._video.style.cursor="zoom-in";
    this._video.zoomIn();
  }

  zoomOut() {
    this._video.zoomOut();
  }

  pan() {
    this._video.style.cursor="move";
    this._video.pan();
  }

  // Go to the frame at the highest resolution
  goToFrame(globalFrame) {
    this._video.onPlay();
    this._setTimeControlStyle();
    if(this._videoMode == "play" && !this._frameInPlayWindow(globalFrame)) {
      this._play._button.setAttribute("disabled","");
      // Use some spaces because the tooltip z-index is wrong
      this._play.setAttribute("tooltip", "    Not in play window");
      this._rewind.setAttribute("disabled","")
      this._fastForward.setAttribute("disabled","");
    }

    return this._video.gotoFrame(globalFrame, true);
  }

  selectNone() {
    this._video.selectNone();
  }

  selectLocalization(loc, skipAnimation, muteOthers, skipGoToFrame) {
    this._video.selectLocalization(loc, skipAnimation, muteOthers, skipGoToFrame);
  }

  selectTrackUsingId(stateId, stateTypeId, frameHint, skipGoToFrame) {
    this._video.selectTrackUsingId(stateId, stateTypeId, frameHint, skipGoToFrame);
  }

  selectTrack(track, frameHint, skipGoToFrame) {
    this._video.selectTrack(track, frameHint, skipGoToFrame);
  }

  deselectTrack() {
    this._video.deselectTrack();
  }

  addCreateTrackType(stateTypeObj) {
    this._video.addCreateTrackType(stateTypeObj);
  }

  addAlgoLaunchOption(algoName) {
    this._video.addAlgoLaunchOption(algoName);
  }

  addAppletToMenu(appletName) {
    this._video.addAppletToMenu(appletName);
  }

  updateAllLocalizations() {
    this._video.updateAllLocalizations();
  }

  enableFillTrackGapsOption() {
    this._video.enableFillTrackGapsOption();
  }

  toggleBoxFills(fill) {
    this._video.toggleBoxFills(fill);
  }

  toggleTextOverlays(on) {
    this._video.toggleTextOverlays(on);
  }

  safeMode() {
    this._scrubInterval = 1000.0/guiFPS;
    console.info("Entered video safe mode");
    return 0;
  }

  displayVideoDiagnosticOverlay(display) {
    this._video.updateVideoDiagnosticOverlay(display);
  }

  allowSafeMode(allow) {
    this._video.allowSafeMode = allow;
  }

  getVideoSettings() {

    const seekInfo = this._video.getQuality("seek");
    const scrubInfo = this._video.getQuality("scrub");
    const playInfo = this._video.getQuality("play");

    return {
        seekQuality: seekInfo.quality,
        seekFPS: seekInfo.fps,
        scrubQuality: scrubInfo.quality,
        scrubFPS: scrubInfo.fps,
        playQuality: playInfo.quality,
        playFPS: playInfo.fps,
        focusedQuality: null,
        focusedFPS: null,
        dockedQuality: null,
        dockedFPS: null,
        allowSafeMode: this._allowSafeMode
      };
  }
}

customElements.define("annotation-player-experimental", AnnotationPlayerExperimental);
