import { TatorElement } from "../components/tator-element.js";

export class SeekBarExperimental extends TatorElement {
  constructor() {
    super();
    this.bar = document.createElement("div");
    this.bar.setAttribute("class", "range-div select-pointer");
    this._shadow.appendChild(this.bar);

    this.handle = document.createElement("div");
    this.handle.setAttribute("class", "range-handle");
    this.handle.setAttribute("tabindex", "0");
    this.handle.id = "seek-bar-handle";
    this.handle.style.cursor = "pointer";
    this.bar.appendChild(this.handle);
    this._loadedPercentage = 0;
    this._visualType = "";
    this._active = false;

    var that = this;
    var clickHandler=function(evt)
    {
      this._active = false;
      var width = that.offsetWidth;
      var startX = that.offsetLeft;
      if (width == 0)
      {
        width =
          that.parentElement.offsetWidth;
        startX = that.parentElement.offsetLeft;
      }

      var frame = Math.round((evt.offsetX / that.bar.offsetWidth) *  (that._max - that._min)) + that._min;
      that.value = frame;
      that.dispatchEvent(
        new CustomEvent("change",
                        {composed: true,
                         detail: {frame: that.value}}));
      evt.stopPropagation();
      return false;
    }
    this.bar.addEventListener("click", clickHandler);

    var sendUpdate = (evt, evt_type, updateType) => {

      if (updateType == "scrub" && that._loadedPercentage < 0.999) {
        return;
      }

      // Only recalculate if it is an input, not a change
      if (evt_type == "input")
      {
        var width = that.offsetWidth;
        if (width == 0)
        {
          width = that.parentElement.offsetWidth;
        }
        var relativeX =
            Math.min(Math.max(evt.pageX - that.offsetLeft,0),
                     width);
        const percentage = Math.min(relativeX/width,
                                    that._loadedPercentage);

        var frame = Math.round((percentage * (that._max - that._min) + that._min));
        if (updateType == "scrub") {
          // Snap to the nearest scrub interval
          frame = Math.round(frame / that._scrubInterval) * that._scrubInterval;
        }

        that.value = frame;
      }
      that.dispatchEvent(
        new CustomEvent(evt_type,
                        {composed: true}));
      evt.stopPropagation();
      return false;
    };
    var dragHandler=function(evt)
    {
      if (evt.button == 0)
      {
        return sendUpdate(evt, "input", "scrub");
      }
      evt.cancelBubble=true;
      return false;
    }
    var releaseMouse=function(evt)
    {
      console.info("RELEASE MOUSE.");
      that._active = false;
      clearInterval(that._periodicCheck);
      document.removeEventListener("mouseup",
                                   releaseMouse);
      document.removeEventListener("mousemove",
                                   dragHandler);
      sendUpdate(evt, "change");
      that.handle.classList.remove("range-handle-selected");
      // Add back in event handler next iteration (time=0)
      setTimeout(() =>
                 {
                   that.bar.addEventListener("click", clickHandler);
                 },0);
    }
    this.handle.addEventListener("mousedown", evt => {
      this._active = true;
      this._lastValue = this.value;

      this._periodicCheck = setInterval(() =>
        {
        if (this._value == this._lastValue)
        {
          return;
        }
        this._lastValue = this.value;
        this.dispatchEvent(
          new CustomEvent("input",
                          {composed: true,
                          detail: {frame: this.value}}));
        }
      , 30);
      that.bar.removeEventListener("click", clickHandler);
      document.addEventListener("mouseup",
                                releaseMouse);
      document.addEventListener("mousemove",
                                dragHandler);
      this.handle.classList.add("range-handle-selected");
      evt.stopPropagation();
      return false;
    });



    this.loadProgress = document.createElement("div");
    this.loadProgress.setAttribute("class", "range-loaded");
    this.notSelectLoadProgress = document.createElement("div");
    this.notSelectLoadProgress.setAttribute("class", "blue-iris-range-loaded");
    this.bar.appendChild(this.loadProgress);
    this.bar.appendChild(this.notSelectLoadProgress);

    this._min = 0;
    this._max = 100;
    this._scrubInterval = 1;
    this._value = 0;

    this.bar.addEventListener("mouseover", (evt) => {

      const handlePos = this.handle.getBoundingClientRect();
      if (evt.clientX <= (handlePos.x + handlePos.width*1.25) &&
          evt.clientX >= (handlePos.x - handlePos.width*0.25)) {
        this.dispatchEvent(new Event("mouseHoverOff"));
        return;
      }

      var frame = Math.round((evt.offsetX / this.bar.offsetWidth) *  (this._max - this._min)) + this._min;
      this.dispatchEvent(new CustomEvent("mouseHover", {detail: {frame: frame}}));
    });

    this.bar.addEventListener("mousemove", (evt) => {

      const handlePos = this.handle.getBoundingClientRect();
      if (evt.clientX <= (handlePos.x + handlePos.width*1.25) &&
          evt.clientX >= (handlePos.x - handlePos.width*0.25)) {
        this.dispatchEvent(new Event("mouseHoverOff"));
        return;
      }

      var frame = Math.round((evt.offsetX / this.bar.offsetWidth) *  (this._max - this._min)) + this._min;
      this.dispatchEvent(new CustomEvent("mouseHover", {detail: {frame: frame}}));
    });

    this.bar.addEventListener("mouseout", (evt) => {
      this.dispatchEvent(new Event("mouseHoverOff"));
    });
  }

  setStyle(barClass, loadedClass) {
    this.bar.setAttribute("class", `${barClass} select-pointer`);
    this.loadProgress.setAttribute("class", `${loadedClass}`);
  }

  changeVisualType(visualType) {
    if (visualType == "zoom") {
      this.visualType = "zoom";
      this.bar.setAttribute("class", "zoom-range-div select-pointer");
      this.loadProgress.setAttribute("class", "zoom-range-loaded");
    }
  }

  updateVisuals(frame)
  {
    var frameToUse = frame;
    if (frame == undefined) {
      frameToUse = this._value;
    }
    const percentage = ((frameToUse-this._min)/(this._max - this._min))*100;
    if (percentage > 100 || percentage < 0) {
      this.handle.style.display = "none";
    }
    else {
      this.handle.style.display = "block";
      this.handle.style.left = `${percentage}%`;
    }
  }

  get active()
  {
    return this._active;
  }

  attributeChangedCallback(name, oldValue, newValue)
  {
    switch(name)
    {
      case 'min':
        this._min = Number(newValue);
        break;
      case 'max':
        this._max = Number(newValue);
        break;
    }
    this.updateVisuals();
  }

  set value(val)
  {
    this._value=val;
    this.updateVisuals();
  }

  get value()
  {
    return this._value;
  }

  onBufferLoaded(loadedPercentage)
  {
    if (loadedPercentage > 0.999) {
      this.notSelectLoadProgress.style.display = "none";
      this.loadProgress.style.display = "block";
    }
    else {
      this.notSelectLoadProgress.style.display = "block";
      this.loadProgress.style.display = "none";
    }
    this._loadedPercentage = loadedPercentage;
    this.loadProgress.style.width=`${loadedPercentage * 100}%`;
    this.notSelectLoadProgress.style.width=`${loadedPercentage * 100}%`;
  }

  onDemandLoaded(evt)
  {
    if (evt.detail.ranges.length == 0)
    {
      return;
    }
    let range = evt.detail.ranges[0]
    const start = range[0];
    const end = range[1];
    const startPercentage = start / this._max;
    const endPercentage = end / this._max;
    this.onDemandProgress.style.marginLeft = `${startPercentage*100}%`;
    const widthPx = Math.round((endPercentage-startPercentage)*this.bar.clientWidth);
    this.onDemandProgress.style.width = `${widthPx}px`;
  }

  /**
   * Alternative to onBufferLoaded. Uses a passed in frame
   */
  setLoadProgress(frame) {
    const percentage = ((frame-this._min)/(this._max - this._min));
    if (percentage > 1) {
      this.onBufferLoaded(1.0);
    }
    else if (percentage < 0) {
      this.onBufferLoaded(0.0);
    }
    else {
      this.onBufferLoaded(percentage);
    }
  }

  setScrubInterval(scrubInterval) {
    this._scrubInterval = scrubInterval;
  }

  static get observedAttributes() { return ['min', 'max']; }
}

customElements.define("seek-bar-experimental", SeekBarExperimental);
