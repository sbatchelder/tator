import { TatorPage } from "../components/tator-page.js";
import { getCookie } from "../util/get-cookie.js";
import { fetchRetry } from "../util/fetch-retry.js";
import { Utilities } from "../util/utilities.js";
import TatorLoading from "../../images/tator_loading.gif";

/**
 * Developer notes:
 * - Currently only support the single video player
 * - Does not have:
 *
 * - Uses version2:
 *   timeline-v2
 *   annotation-player-v2
 */

export class AnnotationPageExperimental extends TatorPage {
  constructor() {
    super();
    this._loading = document.createElement("img");
    this._loading.setAttribute("class", "loading");
    this._loading.setAttribute("src", TatorLoading);
    this._shadow.appendChild(this._loading);
    this._versionLookup = {};

    document.body.setAttribute("class", "no-padding-bottom");

    const header = document.createElement("div");
    this._headerDiv = this._header._shadow.querySelector("header");
    header.setAttribute("class", "annotation__header d-flex flex-items-center flex-justify-between px-2 f3");
    const user = this._header._shadow.querySelector("header-user");
    user.parentNode.insertBefore(header, user);

    const div = document.createElement("div");
    div.setAttribute("class", "d-flex flex-items-center");
    header.appendChild(div);

    this._prev = document.createElement("media-prev-button");
    div.appendChild(this._prev);

    this._next = document.createElement("media-next-button");
    div.appendChild(this._next);

    this._breadcrumbs = document.createElement("annotation-breadcrumbs");
    div.appendChild(this._breadcrumbs);

    const settingsDiv = document.createElement("div");
    settingsDiv.setAttribute("class", "d-flex");
    header.appendChild(settingsDiv);

    this._lightSpacer = document.createElement("span");
    this._lightSpacer.style.width = "32px";
    settingsDiv.appendChild(this._lightSpacer);

    this._success = document.createElement("success-light");
    this._lightSpacer.appendChild(this._success);

    this._warning = document.createElement("warning-light");
    this._lightSpacer.appendChild(this._warning);

    this._versionButton = document.createElement("version-button");
    settingsDiv.appendChild(this._versionButton);

    this._settings = document.createElement("annotation-settings");
    settingsDiv.appendChild(this._settings);

    this._main = document.createElement("main");
    this._main.setAttribute("class", "d-flex px-3");
    this._shadow.appendChild(this._main);

    this._versionDialog = document.createElement("version-dialog");
    this._main.appendChild(this._versionDialog);

    this._progressDialog = document.createElement("progress-dialog");
    this._main.appendChild(this._progressDialog);

    this._videoSettingsDialog = document.createElement("video-settings-dialog");
    this._main.appendChild(this._videoSettingsDialog);

    this._undo = document.createElement("undo-buffer");

    this._data = document.createElement("annotation-data");

    this._progressDialog.addEventListener("close", () => {
      this.removeAttribute("has-open-modal", "");
      this._progressDialog.removeAttribute("is-open", "");
    });

    this._progressDialog.addEventListener("jobsDone", evt => {
      evt.detail.job.callback(evt.detail.status);
    });

    window.addEventListener("error", () => {
      this._loading.style.display = "none";
      Utilities.warningAlert("System error detected","#ff3e1d", true);
    });

    this._settings._bookmark.addEventListener("click", () => {
      this._bookmarkDialog.setAttribute("is-open", "");
      this.setAttribute("has-open-modal", "");
      document.body.classList.add("shortcuts-disabled");
    });
  }

  static get observedAttributes() {
    return ["project-name", "project-id", "media-id"].concat(TatorPage.observedAttributes);
  }

  connectedCallback() {
    this.setAttribute("has-open-modal", "");
    TatorPage.prototype.connectedCallback.call(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    TatorPage.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
    switch (name) {
      case "project-name":
        this._breadcrumbs.setAttribute("project-name", newValue);
        break;
      case "project-id":
        this._undo.setAttribute("project-id", newValue);
        this._updateLastVisitedBookmark();
        break;
      case "media-id":
        const searchParams = new URLSearchParams(window.location.search);
        fetch(`/rest/Media/${newValue}?presigned=28800`, {
          method: "GET",
          credentials: "same-origin",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        })
        .then(response => response.json())
        .then(data => {
          this._archive_state = data.archive_state;
          if (this._archive_state == "archived") {
            this._loading.style.display = "none";
            window.alert("Media has been archived and cannot be viewed in the annotator.");
            Utilities.warningAlert("Media has been archived.", "#ff3e1d", true);
            return;
          }
          else if (this._archive_state == "to_live") {
            this._loading.style.display = "none";
            window.alert("Archived media is not live yet and cannot be viewed in the annotator.");
            Utilities.warningAlert("Media has been archived.", "#ff3e1d", true);
            return;
          }
          else if (data.media_files == null ||
              (data.media_files &&
               !('streaming' in data.media_files) &&
               !('layout' in data.media_files) &&
               !('image' in data.media_files) &&
               !('live' in data.media_files)))
          {
            this._loading.style.display = "none";
            Utilities.sendNotification(`Unplayable file ${data.id}`);
            window.alert("Video can not be played. Please contact the system administrator.")
            return;
          } else if (data.media_files && 'streaming' in data.media_files) {
            data.media_files.streaming.sort((a, b) => {return b.resolution[0] - a.resolution[0];});
          }
          this._breadcrumbs.setAttribute("media-name", data.name);
          this._undo.mediaInfo = data;

          fetch("/rest/MediaType/" + data.meta, {
            method: "GET",
            credentials: "same-origin",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
              "Accept": "application/json",
              "Content-Type": "application/json"
            }
          })
          .then((response) => response.json())
          .then(type_data => {
            this._undo.mediaType = type_data;
            let player;
            this._mediaIds = [];
            this._numberOfMedia = 1;
            this._mediaDataCount = 0;
            if (type_data.dtype == "video") {
              player = document.createElement("annotation-player-experimental");
              this._player = player;
              this._player.mediaType = type_data;
              player.addDomParent({"object": this._headerDiv,
                                   "alignTo":  this._main});
              this._main.appendChild(player);
              player.mediaInfo = data;
              this._setupInitHandlers(player);
              this._getMetadataTypes(player, player._video._canvas);
              this._videoSettingsDialog.mode("single", [data]);
              this._settings._capture.addEventListener(
                'captureFrame',
                (e) =>
                  {
                    player._video.captureFrame(e.detail.localizations);
                  });
              this._videoSettingsDialog.addEventListener("apply", (evt) => {
                player.apply
              });
            }
            else {
              window.alert(`${type_data.dtype} not supported`);
              return;
            }
          });
          const nextPromise = fetch(`/rest/MediaNext/${newValue}${window.location.search}`, {
            method: "GET",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
              "Accept": "application/json",
              "Content-Type": "application/json",
            }
          });
          const prevPromise = fetch(`/rest/MediaPrev/${newValue}${window.location.search}`, {
            method: "GET",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
              "Accept": "application/json",
              "Content-Type": "application/json",
            }
          });
          Promise.all([nextPromise, prevPromise])
          .then(responses => Promise.all(responses.map(resp => resp.json())))
          .then(([nextData, prevData]) => {
            const baseUrl = `/${data.project}/annotation/`;
            const searchParams = this._settings._queryParams();
            const media_id = parseInt(newValue);

            // Turn disable selected_type.
            searchParams.delete("selected_type");

            // Only enable next/prev if there is a next/prev
            if (prevData.prev == -1) {
              this._prev.disabled = true;
            }
            else {
              this._prev.addEventListener("click", () => {
                let url = baseUrl + prevData.prev;
                var searchParams = this._settings._queryParams();
                searchParams.delete("selected_type");
                searchParams.delete("selected_entity");
                searchParams.delete("frame");
                const typeParams = this._settings._typeParams();
                if (typeParams) {
                  searchParams.append("selected_type",typeParams)
                }
                searchParams = this._videoSettingsDialog.queryParams(searchParams);
                url += "?" + searchParams.toString();
                window.location.href = url;
              });
            }

            if (nextData.next == -1) {
              this._next.disabled = true;
            }
            else {
              this._next.addEventListener("click", () => {
                let url = baseUrl + nextData.next;
                var searchParams = this._settings._queryParams();
                searchParams.delete("selected_type");
                searchParams.delete("selected_entity");
                searchParams.delete("frame");
                const typeParams = this._settings._typeParams();
                if (typeParams) {
                  searchParams.append("selected_type", typeParams)
                }
                searchParams = this._videoSettingsDialog.queryParams(searchParams);
                url += "?" + searchParams.toString();
                window.location.href = url;
              });
            }
          })
          .catch(err => console.log("Failed to fetch adjacent media! " + err));
          fetch("/rest/Project/" + data.project, {
            method: "GET",
            credentials: "same-origin",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
              "Accept": "application/json",
              "Content-Type": "application/json"
            }
          })
          .then(response => response.json())
          .then(data => {
            this._permission = data.permission;
          });
          const countUrl = `/rest/MediaCount/${data.project}?${searchParams.toString()}`;
          searchParams.set("after_id", data.id);
          const afterUrl = `/rest/MediaCount/${data.project}?${searchParams.toString()}`;
          const countPromise = fetchRetry(countUrl, {
            method: "GET",
            credentials: "same-origin",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
              "Accept": "application/json",
              "Content-Type": "application/json"
            }
          });
          const afterPromise = fetchRetry(afterUrl, {
            method: "GET",
            credentials: "same-origin",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
              "Accept": "application/json",
              "Content-Type": "application/json"
            }
          });
          Promise.all([countPromise, afterPromise])
          .then(([countResponse, afterResponse]) => {
            const countData = countResponse.json();
            const afterData = afterResponse.json();
            Promise.all([countData, afterData])
            .then(([count, after]) => {
              this._breadcrumbs.setPosition(count - after, count);
            });
          });
        })
        break;
    }
  }

  _setupInitHandlers(canvas) {
    this._canvas = canvas;
    const _handleQueryParams = () => {
      if (this._dataInitialized && this._canvasInitialized) {
        const searchParams = new URLSearchParams(window.location.search);
        const haveEntity = searchParams.has("selected_entity");
        const haveType = searchParams.has("selected_type");
        const haveVersion = searchParams.has("version");
        const haveLock = searchParams.has("lock");
        const haveFillBoxes = searchParams.has("fill_boxes");
        const haveToggleText = searchParams.has("toggle_text");
        if (haveEntity && haveType) {
          const typeId = searchParams.get("selected_type");
          const entityId = Number(searchParams.get("selected_entity"));
          this._settings.setAttribute("type-id", typeId);
          this._settings.setAttribute("entity-id", entityId);
        } else if (haveType) {
          const typeId = Number(searchParams.get("selected_type"));
          this._settings.setAttribute("type-id", typeId);
        }
        if (haveVersion)
        {
          let version_id = searchParams.get("version");
          let evt = {"detail": {"version": this._versionLookup[version_id]}};
          this._versionDialog._handleSelect(evt);
        }
        if (haveLock) {
          const lock = Number(searchParams.get("lock"));
          if (lock) {
            this._settings._lock.lock();
          }
        }
        if (haveFillBoxes) {
          const fill_boxes = Number(searchParams.get("fill_boxes"));
          if (fill_boxes) {
            this._settings._fill_boxes.fill();
          }
          else {
            this._settings._fill_boxes.unfill();
          }
          canvas.toggleBoxFills(this._settings._fill_boxes.get_fill_boxes_status());
        }
        if (haveToggleText) {
          const toggle_text = Number(searchParams.get("toggle_text"));
          if (toggle_text) {
            this._settings._toggle_text.toggle = true;
          }
          else {
            this._settings._toggle_text.toggle = false
          }
          canvas.toggleTextOverlays(this._settings._toggle_text.get_toggle_status());
        }
      }
    }

    const _removeLoading = (force) => {
      if ((this._dataInitialized && this._canvasInitialized) || force) {
        try
        {
          this._loading.style.display = "none";
          this.removeAttribute("has-open-modal");
          window.dispatchEvent(new Event("resize"));

          if (this._archive_state == "to_archive") {
            Utilities.warningAlert("Warning: This media has been marked for archival!", "#ff3e1d", false);
          }
        }
        catch(exception)
        {
          //pass
        }
      }
    }

    this._data.addEventListener("initialized", () => {
      this._dataInitialized = true;
      _handleQueryParams();
      _removeLoading();
    });

    canvas.addEventListener("playing", () => {
      this._player.disableQualityChange();
    });

    canvas.addEventListener("paused", () => {
      this._player.enableQualityChange();
    });

    canvas.addEventListener("canvasReady", () => {
      this._canvasInitialized = true;
      _handleQueryParams();
      _removeLoading();
    });

    canvas.addEventListener("videoInitError", () => {
      _removeLoading(true);
    });

    canvas.addEventListener("defaultVideoSettings", evt => {
      this._videoSettingsDialog.defaultSources = evt.detail;
    });

    this._settings._lock.addEventListener("click", evt=> {
      this.enableEditing(true);
    });

    this._settings._fill_boxes.addEventListener("click", evt => {
      canvas.toggleBoxFills(this._settings._fill_boxes.get_fill_boxes_status());
      canvas.refresh();
    })

    this._settings._toggle_text.addEventListener("click", evt => {
      canvas.toggleTextOverlays(this._settings._toggle_text.get_toggle_status());
      canvas.refresh();
    })

    canvas.addEventListener("toggleTextOverlay", evt => {
      this._settings._toggle_text.toggle = !this._settings._toggle_text.get_toggle_status()
      canvas.toggleTextOverlays(this._settings._toggle_text.get_toggle_status());
      canvas.refresh();
    });

    if (this._player._rateControl) {
      this._player._rateControl.addEventListener("rateChange", evt => {
        if ("setRate" in canvas) {
          canvas.setRate(evt.detail.rate);
        }
      });
    }

    if (this._player._qualityControl) {
      this._player._qualityControl.addEventListener("qualityChange", evt => {
        if ("setQuality" in canvas) {
          canvas.setQuality(evt.detail.quality);
        }

        var videoSettings = canvas.getVideoSettings();
        this._videoSettingsDialog.applySettings(videoSettings);
      });
    }

    canvas.addEventListener("zoomChange", evt => {
      this._settings.setAttribute("zoom", evt.detail.zoom);
    });

    this._settings.addEventListener("zoomPlus", () => {
      if ("zoomPlus" in canvas) {
        canvas.zoomPlus();
      }
    });

    this._settings.addEventListener("zoomMinus", () => {
      if ("zoomMinus" in canvas) {
        canvas.zoomMinus();
      }
    });

    this._videoSettingsDialog.addEventListener("close", () => {
      this.removeAttribute("has-open-modal", "");
      document.body.classList.remove("shortcuts-disabled");
    });

    this._videoSettingsDialog.addEventListener("applyVideoSources", evt => {
      for (let sourceName in evt.detail) {
        let source = evt.detail[sourceName];
        if (source) {
          canvas.setQuality(source.quality, source.name);

          if (source.name == "play") {
            this._player.quality = source.quality;
          }
        }
      }
    });

    this._videoSettingsDialog.addEventListener("displayOverlays", evt => {
      canvas.displayVideoDiagnosticOverlay(evt.detail.displayDiagnostic);
    });

    this._videoSettingsDialog.addEventListener("allowSafeMode", evt => {
      canvas.allowSafeMode(evt.detail.allowSafeMode);
    });

    this._player.addEventListener("setPlayQuality", (evt) => {
      this._videoSettingsDialog.setPlayQuality(evt.detail.quality);
    });

    this._player.addEventListener("openVideoSettings", () => {
      var videoSettings = canvas.getVideoSettings();
      this._videoSettingsDialog.applySettings(videoSettings);
      this._videoSettingsDialog.setAttribute("is-open", "");
      this.setAttribute("has-open-modal", "");
      document.body.classList.add("shortcuts-disabled");
    });
  }

  _getMetadataTypes(canvas, canvasElement, block_signals, subelement_id, update) {
    const projectId = Number(this.getAttribute("project-id"));
    let mediaId = Number(this.getAttribute("media-id"));
    if (subelement_id)
    {
      mediaId = subelement_id;
    }
    const query = "?media_id=" + mediaId;
    const favoritePromise = fetch("/rest/Favorites/" + projectId, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const versionPromise = fetch(`/rest/Versions/${projectId}`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const membershipPromise = fetch(`/rest/Memberships/${projectId}`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const getMetadataType = endpoint => {
      const url = "/rest/" + endpoint + "/" + projectId + query;
      return fetch(url, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
    };
    Promise.all([
      getMetadataType("LocalizationTypes"),
      getMetadataType("StateTypes"),
      versionPromise,
      favoritePromise,
      membershipPromise,
    ])
    .then(([localizationResponse, stateResponse, versionResponse, favoriteResponse,
            membershipResponse]) => {
      const localizationData = localizationResponse.json();
      const stateData = stateResponse.json();
      const versionData = versionResponse.json();
      const favoriteData = favoriteResponse.json();
      const membershipData = membershipResponse.json();
      Promise.all([localizationData, stateData, versionData, favoriteData, membershipData])
      .then(([localizationTypes, stateTypes, versions, favorites, memberships]) => {
        // Only display positive version numbers.
        versions = versions.filter(version => version.number >= 0);

        for (const version of versions) {
          this._versionLookup[version.id] = version;
        }

        // If there is a default version pick that one, otherwise use the first one.
        this._version == null;
        let default_version = versions[0].id;
        for (const membership of memberships) {
          if (membership.user == this.getAttribute("user-id")) {
            if (membership.default_version) {
              default_version = membership.default_version;
            }
          }
        }

        // Finde the index of the default version.
        let selected_version_idx = 0;
        for (const [idx, version] of versions.entries()) {
          if (version.id == default_version) {
            this._version = this._versionLookup[default_version];
            selected_version_idx = idx;
          }
        }

        // Initialize version dialog.
        this._versionDialog.init(versions, selected_version_idx);
        if (versions.length == 0) {
          this._versionButton.style.display = "none";
        } else {
          this._versionButton.text = this._version.name;
        }

        var dataTypes = localizationTypes.concat(stateTypes)

        // Replace the data type IDs so they are guaranteed to be unique.
        for (let [idx,dataType] of dataTypes.entries()) {
          dataType.id = dataType.dtype + "_" + dataType.id;
        }
        for (let [idx,dataType] of dataTypes.entries()) {
          let isLocalization=false;
          let isTrack=false;
          let isTLState=false;
          if ("dtype" in dataType) {
            isLocalization = ["box", "line", "dot", "poly"].includes(dataType.dtype);
          }
          if ("association" in dataType) {
            isTrack = (dataType.association == "Localization");
          }
          if ("interpolation" in dataType) {
            isTLState = (dataType.interpolation == "latest");
          }
          dataType.isLocalization = isLocalization;
          dataType.isTrack = isTrack;
          dataType.isTLState = isTLState;

          if (dataType.isTrack) {
            // Determine the localization type that should be drawn.
            let localizationTypeId = null;
            if (dataType.default_localization) {
              localizationTypeId = dataType.default_localization;
            } else {
              // If default localization type is not set, go by priority box > line > dot.
              const byType = dataTypes.reduce((sec, obj) => {
                if (obj.visible && obj.drawable) {
                  (sec[obj.dtype] = sec[obj.dtype] || []).push(obj);
                }
                return sec;
              }, {});
              if (typeof byType.box !== "undefined") {
                localizationTypeId = byType.box[0].id;
              } else if (typeof byType.line !== "undefined") {
                localizationTypeId = byType.line[0].id;
              } else if (typeof byType.dot !== "undefined") {
                localizationTypeId = byType.dot[0].id;
              }
            }
            if (localizationTypeId === null) {
              throw "Could not find a localization type to use for track creation!";
            }
            dataType.localizationType = dataTypes.filter(type => (type.id == localizationTypeId
                                                                  || Number(type.id.split('_')[1]) == localizationTypeId))[0];
          }
        }
        this._data.init(dataTypes, this._version, projectId, mediaId, update, !block_signals);
        this._data.addEventListener("freshData", evt => {});
        this._mediaDataCount += 1;

        // Pull the data / iniitliaze the app if we are using the multi-view player and
        // if all of the media has already registered their data types
        if (this._mediaDataCount == this._numberOfMedia && this._player.mediaType.dtype == "multi") {
          this._data.initialUpdate();
        }

        canvas.undoBuffer = this._undo;
        canvas.annotationData = this._data;

        const byType = localizationTypes.reduce((sec, obj) => {
          if (obj.visible && obj.drawable) {
            (sec[obj.dtype] = sec[obj.dtype] || []).push(obj);
          }
          return sec;
        }, {});
        const trackTypes = stateTypes.filter(type => type.association == 'Localization'
                                                     && type.visible);

        if (block_signals == true)
        {
          return;
        }

        this._undo.addEventListener("update", evt => {

          // Force selecting this new entity in the browser if a new object was created
          // when the data is retrieved (ie freshData event)
          if (evt.detail.method == "POST") {
            this._newEntityId = evt.detail.id;
          }

          this._data.updateTypeLocal(
            evt.detail.method,
            evt.detail.id,
            evt.detail.body,
            evt.detail.dataType,
          );
        });

        canvas.addEventListener("modeChange", evt => {
          this._sidebar.modeChange(evt.detail.newMode, evt.detail.metaMode);
        });

        canvas.addEventListener("maximize", () => {
          document.body.requestFullscreen();
        });

        canvas.addEventListener("minimize", () => {
          document.exitFullscreen();
        });
      });
   });
  }

  /**
   * Updates the last visited bookmark (called 'Last visited')
   * with the current window URL
   */
  _updateLastVisitedBookmark() {
    const uri = `${window.location.pathname}${window.location.search}`;
    const name = "Last visited";
    // Get the last visited, if it exists.
    fetch(`/rest/Bookmarks/${this.getAttribute("project-id")}?name=${name}`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
    })
    .then(response => response.json())
    .then(data => {
      if (data.length == 0) {
        fetch(`/rest/Bookmarks/${this.getAttribute("project-id")}`, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({name: name, uri: uri}),
        });
      } else {
        const id = data[0].id;
        fetch(`/rest/Bookmark/${id}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({name: name, uri: uri}),
        });
      }
    });
  }

  _showAlgoRunningDialog(uid, msg, callback) {
    this._progressDialog.monitorJob(uid, msg, callback);
    this._progressDialog.setAttribute("is-open", "");
    this.setAttribute("has-open-modal", "");
  };


}

customElements.define("annotation-page-experimental", AnnotationPageExperimental);
