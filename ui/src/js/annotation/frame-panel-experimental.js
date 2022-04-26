import { TatorElement } from "../components/tator-element.js";

export class FramePanelExperimental extends TatorElement {
  constructor() {
    super();

    const div = document.createElement("div");
    div.setAttribute("class", "annotation__panel px-4 rounded-2");
    this._shadow.appendChild(div);

    this._name = document.createElement("h3");
    this._name.setAttribute("class", "py-3 text-semibold");
    div.appendChild(this._name);

    this._attributes = document.createElement("attribute-panel-experimental");
    div.appendChild(this._attributes);
  }

  /**
   * @param {GlobalTimeKeeper} val
   */
  set timeKeeper(val) {
    this._timeKeeper = val;
  }

  set permission(val) {
    this._attributes.permission = val;
  }

  set undoBuffer(val) {
    this._undo = val;
  }

  set annotationData(val) {
    this._data = val;
  }

  set version(val) {
    this._version = val;
  }

  set dataType(val) {
    this._name.textContent = val.name;
    this._typeId = val.id;
    this._method = val.interpolation;
    this._attributes.dataType = val;
    this._attributes.addEventListener("change", () => {
      if (this._blockingWrites) {
        return;
      }
      const values = this._attributes.getValues();
      if (values !== null) {
        this._blockingUpdates = true;
        const data = this._data._dataByType.get(val.id);
        const index = data.findIndex(elem => this._getGlobalFrame(elem) === this._globalFrame);
        if (index === -1) {
          var postMediaList = this._timeKeeper.getMediaFromFrame(this._globalFrame);
          var mediaIdList = [];
          for (const media of postMediaList) {
            mediaIdList.push(media.id);
          }
          const body = {
            type: Number(val.id.split("_")[1]),
            name: val.name,
            media_ids: mediaIdList,
            frame: this._timeKeeper.getMediaFrame(mediaIdList[0], this._globalFrame),
            version: this._version.id,
            ...values,
          };
          this._undo.post("States", body, val);
        } else {
          const state = data[index];
          this._undo.patch("State", state.id, {"attributes": values}, val);
        }
      }
    });
    this._data.addEventListener("freshData", evt => {
      const typeObj = evt.detail.typeObj;
      if ((typeObj.id === val.id) && (this._globalFrame !== null)) {
        this._updateAttributes(evt.detail.data);
      }
    });
  }

  _getGlobalFrame(elem) {
    return this._timeKeeper.getGlobalFrame("matchFrame", elem.media, elem.frame);
  }

  frameChange(globalFrame) {
    this._globalFrame = globalFrame;
    if (this._typeId && this._data) {
      const data = this._data._dataByType.get(this._typeId);
      this._updateAttributes(data);
    }
  }

  _updateAttributes(data) {
    if (this._blockingUpdates) {
      this._blockingUpdates = false;
      return;
    }
    if (data) {
      if (data.length > 0) {
        this._blockingWrites = true;
        const values = this._getInterpolated(data);
        this._attributes.setValues(values);
        this._blockingWrites = false;
      }
    }
  }

  _getInterpolated(data) {
    data.sort((a, b) => this._getGlobalFrame(a) - this._getGlobalFrame(b));
    const frameDiffs = data.map(
      (elem, idx) => [Math.abs(this._getGlobalFrame(elem) - this._globalFrame), idx]
    );
    const nearestIdx = frameDiffs.reduce((r, a) => (a[0] < r[0] ? a : r))[1];
    let beforeIdx, afterIdx;
    const frameDiff = this._getGlobalFrame(data[nearestIdx]) - this._globalFrame;
    if (frameDiff < 0) {
      beforeIdx = nearestIdx;
      afterIdx = Math.min(beforeIdx + 1, data.length - 1);
    } else if (frameDiff > 0) {
      afterIdx = nearestIdx;
      beforeIdx = Math.max(afterIdx - 1, 0);
    } else {
      beforeIdx = nearestIdx;
      afterIdx = nearestIdx;
    }
    let attrs;
    let id;
    switch (this._method) {
      case "latest":
        attrs = data[beforeIdx].attributes;
        id = data[beforeIdx].id;
        break;
    }
    return {attributes: attrs, id: id};
  }
}

customElements.define("frame-panel-experimental", FramePanelExperimental);
