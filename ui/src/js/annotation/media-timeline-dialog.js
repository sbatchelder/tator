import { ModalDialog } from "../components/modal-dialog.js";

export class MediaTimelineDialog extends ModalDialog {
  constructor() {
    super();

    this._div.setAttribute("class", "modal-wrap modal-super-wide d-flex");
    this._title.nodeValue = "Media Timeline Information";

    this._contentDiv = document.createElement("div");
    this._contentDiv.setAttribute("class", "d-flex flex-grow flex-column");
    this._main.appendChild(this._contentDiv);
  }

  /**
   * @param {GlobalTimeKeeper} val - Must be initialized.
   */
  set timeKeeper(val) {
    this._timeKeeper = val;
    this._init();
  }

  _setupMainMediaInfo(parentDiv) {

    const parentMedia = this._timeKeeper.getParentMedia();

    var headerDiv = document.createElement("div");
    headerDiv.setAttribute("class", "media-timeline-dialog-header d-flex py-2 px-4 flex-grow flex-column");
    parentDiv.appendChild(headerDiv);

    var parentWrapper = document.createElement("div");
    parentWrapper.setAttribute("class", "d-flex flex-items-center h3 text-white py-1 text-uppercase");
    parentWrapper.textContent = "Main Media";
    headerDiv.appendChild(parentWrapper);

    var outerWrapper = document.createElement("div");
    outerWrapper.setAttribute("class", "d-flex flex-grow ml-3")
    parentWrapper.appendChild(outerWrapper);

    var wrapper = document.createElement("div");
    wrapper.setAttribute("class", "d-flex mr-2")
    outerWrapper.appendChild(wrapper);

    var span = document.createElement("span");
    span.setAttribute("class", "f2 text-left text-gray text-uppercase text-semibold flex-items-center");
    span.textContent = "ID:"
    wrapper.appendChild(span);

    span = document.createElement("span");
    span.setAttribute("class", "f2 text-gray px-1 flex-items-center");
    span.textContent = `${parentMedia.id}`;
    wrapper.appendChild(span);

    wrapper = document.createElement("div");
    wrapper.setAttribute("class", "d-flex mr-2")
    outerWrapper.appendChild(wrapper);

    span = document.createElement("span");
    span.setAttribute("class", "f2 text-left text-gray text-uppercase text-semibold flex-items-center");
    span.textContent = "Name:"
    wrapper.appendChild(span);

    span = document.createElement("span");
    span.setAttribute("class", "f2 text-gray px-1 flex-items-center");
    span.textContent = `${parentMedia.name}`;
    wrapper.appendChild(span);

    wrapper = document.createElement("div");
    wrapper.setAttribute("class", "d-flex mr-2")
    outerWrapper.appendChild(wrapper);

    span = document.createElement("span");
    span.setAttribute("class", "f2 text-left text-gray text-uppercase text-semibold flex-items-center");
    span.textContent = "Global FPS:"
    wrapper.appendChild(span);

    span = document.createElement("span");
    span.setAttribute("class", "f2 text-gray px-1 flex-items-center");
    span.textContent = `${parentMedia.fps}`;
    wrapper.appendChild(span);

    wrapper = document.createElement("div");
    wrapper.setAttribute("class", "d-flex mr-2")
    outerWrapper.appendChild(wrapper);

    span = document.createElement("span");
    span.setAttribute("class", "f2 text-left text-gray text-uppercase text-semibold flex-items-center");
    span.textContent = "Cameras:"
    wrapper.appendChild(span);

    span = document.createElement("span");
    span.setAttribute("class", "f2 text-gray px-1 flex-items-center");
    span.textContent = `${this._timeKeeper.getChannelCount()}`;
    wrapper.appendChild(span);
  }

  _setupTimelineInfo(parentDiv) {

    var headerDiv = document.createElement("div");
    headerDiv.setAttribute("class", "media-timeline-dialog-header d-flex py-2 px-4 flex-grow");
    parentDiv.appendChild(headerDiv);

    var text = document.createElement("div");
    text.setAttribute("class", "d-flex flex-items-center h3 text-white text-uppercase");
    text.textContent = "Timeline"
    headerDiv.appendChild(text);

    var wrapper = document.createElement("div");
    wrapper.setAttribute("class", "d-flex flex-items-center text-gray f2 px-2 mx-3");
    headerDiv.appendChild(wrapper);

    this._timelineSelector = document.createElement("enum-input");
    this._timelineSelector.setAttribute("name", "");
    this._timelineSelector._select.classList.remove("col-8");
    this._timelineSelector._select.style.marginLeft = "5px";
    var choices = [];
    for (const text of ["Camera 0"]) {
      choices.push({"value": text});
    }
    this._timelineSelector.choices = choices;
    wrapper.appendChild(this._timelineSelector);
    this._unitsSelector = document.createElement("enum-input");
    this._unitsSelector.setAttribute("name", "");
    this._unitsSelector._select.classList.remove("col-8");
    this._unitsSelector._select.style.marginLeft = "5px";
    var choices = [];
    for (const text of ["Global Frames", "Relative Time", "UTC"]) {
      choices.push({"value": text});
    }
    this._unitsSelector.choices = choices;
    wrapper.appendChild(this._unitsSelector);

    this._timelineSelector.addEventListener("change", () => {
      this._setupTable(this._tableDiv);
    });

    this._unitsSelector.addEventListener("change", () => {
      this._setupTable(this._tableDiv);
    });

    this._tableDiv = document.createElement("div");
    parentDiv.appendChild(this._tableDiv);
    this._setupTable(this._tableDiv);
  }

  _setupTable(parentTableDiv) {
      
    while (parentTableDiv.firstChild) {
      parentTableDiv.removeChild(parentTableDiv.firstChild);
    }

    var outerDiv = document.createElement("div");
    outerDiv.setAttribute("class", "rounded-2 my-3 px-4")
    parentTableDiv.appendChild(outerDiv);

    var tableDiv = document.createElement("div");
    tableDiv.setAttribute("class", "d-flex flex-grow");
    outerDiv.appendChild(tableDiv);

    var table = document.createElement("table");
    table.setAttribute("class", "text-gray f2 table col-12");
    tableDiv.appendChild(table);

    const thead = document.createElement("thead");
    thead.setAttribute("class", "f3 text-left text-gray text-uppercase text-semibold");
    table.appendChild(thead);

    const trHead = document.createElement("tr");
    thead.appendChild(trHead);
  
    var th = document.createElement("th");
    th.setAttribute("class", "py-2 col-4");
    th.textContent = "Segment";
    trHead.appendChild(th);
  
    th = document.createElement("th");
    th.setAttribute("class", "py-2 col-2");
    th.textContent = "Start";
    trHead.appendChild(th);
  
    th = document.createElement("th");
    th.setAttribute("class", "py-2 col-2");
    th.textContent = "End";
    trHead.appendChild(th);
  
    th = document.createElement("th");
    th.setAttribute("class", "py-2 col-2");
    th.textContent = "Duration";
    trHead.appendChild(th);

    // Generate table contents based on timekeeper data
    var channelIndex = 0;
    var infoList = this._timeKeeper.getChannelTimeline(channelIndex);

    for (const info of infoList) {
      
      const tbody = document.createElement("tbody");
      if (info.displayName.includes("Video Gap")) {
        tbody.setAttribute("class", "f2 text-coral text-semibold py-1");
      }
      else {
        tbody.setAttribute("class", "f2 text-gray py-1");
      }
      table.appendChild(tbody);

      const tr = document.createElement("tr");
      tbody.appendChild(tr);

      var td = document.createElement("td");
      td.textContent = `${info.displayName}`;
      tr.appendChild(td);

      var timeUnits = this._unitsSelector.getValue();
      if (timeUnits == "Global Frames") {

        var td = document.createElement("td");
        td.textContent = `${info.globalStartFrame}`;
        tr.appendChild(td);
  
        var td = document.createElement("td");
        td.textContent = `${info.globalEndFrame}`;
        tr.appendChild(td);
  
        var td = document.createElement("td");
        td.textContent = `${info.globalEndFrame - info.globalStartFrame + 1} Frames`;
        tr.appendChild(td);

      }
      else if (timeUnits == "Relative Time") {

        var td = document.createElement("td");
        td.textContent = `${this._timeKeeper.getRelativeTimeFromFrame(info.globalStartFrame)}`;
        tr.appendChild(td);
  
        var td = document.createElement("td");
        td.textContent = `${this._timeKeeper.getRelativeTimeFromFrame(info.globalEndFrame)}`;
        tr.appendChild(td);
  
        var td = document.createElement("td");
        td.textContent = `${this._timeKeeper.getRelativeTimeFromFrame(info.globalEndFrame - info.globalStartFrame + 1)}`;
        tr.appendChild(td);

      }
      else if (timeUnits == "UTC") {

        var td = document.createElement("td");
        td.textContent = `${this._timeKeeper.getAbsoluteTimeFromFrame(info.globalStartFrame)}`;
        tr.appendChild(td);
  
        var td = document.createElement("td");
        td.textContent = `${this._timeKeeper.getAbsoluteTimeFromFrame(info.globalEndFrame)}`;
        tr.appendChild(td);
  
        var td = document.createElement("td");
        td.textContent = `${this._timeKeeper.getRelativeTimeFromFrame(info.globalEndFrame - info.globalStartFrame + 1)}`;
        tr.appendChild(td);

      }
    }

  }

  /**
   * Sets up the tables that displays:
   *
   * Main Media:
   * Media Name | Media ID | FPS | Number Of Channels
   *
   * Channel Timeline
   * Media Name | Media ID | Start Datetime | End Datetime
   *
   * @precondition Must be executed after the timeKeeper has been initialized.
   */
  _init() {

    this._setupMainMediaInfo(this._contentDiv);
    var spacerDiv = document.createElement("div");
    spacerDiv.setAttribute("class", "py-3");
    this._contentDiv.appendChild(spacerDiv);
    this._setupTimelineInfo(this._contentDiv);

  }

  setupDisplay() {
    this._setupTable(this._tableDiv);
  }
}

customElements.define("media-timeline-dialog", MediaTimelineDialog);