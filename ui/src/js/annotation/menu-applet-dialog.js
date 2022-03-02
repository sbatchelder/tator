import { ModalDialog } from "../components/modal-dialog.js";
import { Utilities } from "../util/utilities.js";

export class MenuAppletDialog extends ModalDialog {
  constructor() {
    super();

    this._div.setAttribute("class", "modal-wrap modal-wide d-flex");
    this._title.nodeValue = "Menu Applet";

    this._appletView = document.createElement("iframe");
    this._appletView.setAttribute("class", "d-flex col-12")
    this._main.appendChild(this._appletView);

    this._main.classList.remove("px-6");
    this._main.classList.add("px-2");

    const accept = document.createElement("button");
    accept.setAttribute("class", "btn btn-clear");
    accept.textContent = "Accept";
    this._footer.appendChild(accept);

    // Stores the Tator Applet objects this dialog will utilize
    // Each object property/key will be the applet name
    this._applets = {};

    // Will point to the applet element to interface with inside the iframe
    this._appletElement = null;
    this._appletData = null;

    // When the user clicks on the accept button,
    // call the active applet's accept function and close the dialog
    accept.addEventListener("click", () => {
      this.removeAttribute("is-open");
      this.dispatchEvent(new Event("close"));
      this._appletElement.accept();
    });

    this._appletView.addEventListener("load", this.initApplet.bind(this));
  }

  /**
   * @param {string} width - default|wide|extra-wide
   */
  _setModalWidth(width) {
    if (width == "default") {
      this._div.classList.remove("modal-wide");
      this._div.classList.remove("modal-extra-wide");
    }
    else if (width == "wide") {
      this._div.classList.add("modal-wide");
      this._div.classList.remove("modal-extra-wide");

    }
    else if (width == "extra-wide") {
      this._div.classList.remove("modal-wide");
      this._div.classList.add("modal-extra-wide");
    }
  }

  /**
   * @param {string} title - Title to display in dialog
   */
   _setModalTitle(title) {
    this._title.nodeValue = title;
  }

  /**
   * @param {string} msg - Message to display using the window utilities
   */
  _displayProgressMessage(msg) {
    Utilities.showSuccessIcon(msg, "#00000000");
  }
  _displayErrorMessage(msg) {
    Utilities.warningAlert(msg, "#ff3e1d");
  }
  _displaySuccessMessage(msg) {
    Utilities.showSuccessIcon(msg);
  }

  /**
   * Saves the applet object internally
   * @param {Tator.Applet} applet
   */
  saveApplet(applet) {
    this._applets[applet.name] = applet;
  }

  /**
   * Set the applet to display using the provided applet name
   * @param {string} appletName - Name of loaded applet to display in modal
   * @param {Object} data - Applet data. Expected to have the following properties:
   *     frame {int}
   *     versionId {int}
   *     mediaId {int}
   *     projectId {int}
   */
  setApplet(appletName, data) {
    this._appletView.src = this._applets[appletName].html_file;
    this._appletData = data;
  }

  initApplet() {
    if (this._appletData == null) { return; }

    this._appletElement = this._appletView.contentWindow.document.getElementById("mainApplet");

    var height = this._appletElement.getModalHeight();
    if (height.includes("px")) {
      this._appletView.style.height = height;
    }

    var title = this._appletElement.getModalTitle();
    this._setModalTitle(title);

    var width = this._appletElement.getModalWidth();
    this._setModalWidth(width);

    // Attach the standard event listeners.
    // If this is changed, update the corresponding documentation since this is an applet API change
    this._appletElement.addEventListener("setModalWidth", (evt) => {
      this._setModalWidth(evt.detail.width);
    });

    this._appletElement.addEventListener("setModalTitle", (evt) => {
      this._setModalTitle(evt.detail.title);
    });

    this._appletElement.addEventListener("displayProgressMessage", (evt) => {
      this._displayProgressMessage(evt.detail.message);
    });

    this._appletElement.addEventListener("displayErrorMessage", (evt) => {
      this._displayErrorMessage(evt.detail.message);
    });

    this._appletElement.addEventListener("displaySuccessMessage", (evt) => {
      this._displaySuccessMessage(evt.detail.message);
    });

    // Set the applet data
    this._appletElement.updateData(this._appletData);

    // Update the UI
    this._appletElement.updateUI();

    this.dispatchEvent(new Event("appletReady"));
  }

}

customElements.define("menu-applet-dialog", MenuAppletDialog);
