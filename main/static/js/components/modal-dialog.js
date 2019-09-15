class ModalDialog extends TatorElement {
  constructor() {
    super();

    this._div = document.createElement("div");
    this._div.setAttribute("class", "modal-wrap d-flex");
    this._shadow.appendChild(this._div);

    const modal = document.createElement("div");
    modal.setAttribute("class", "modal d-flex flex-items-center flex-justify-center flex-column rounded-2");
    this._div.appendChild(modal);

    const close = document.createElement("modal-close");
    modal.appendChild(close);

    this._header = document.createElement("div");
    this._header.setAttribute("class", "modal__header py-6 px-6 lh-default text-center");
    modal.appendChild(this._header);

    this._titleDiv = document.createElement("div");
    this._titleDiv.setAttribute("class", "h2 px-6");
    this._header.appendChild(this._titleDiv);

    this._title = document.createTextNode("");
    this._titleDiv.appendChild(this._title);

    this._main = document.createElement("div");
    this._main.setAttribute("class", "modal__main px-6 py-4");
    modal.appendChild(this._main);

    this._footer = document.createElement("div");
    this._footer.setAttribute("class", "modal__footer d-flex");
    modal.appendChild(this._footer);

    this._closeCallback = evt => {
      this.dispatchEvent(new Event("close"));
      this.removeAttribute("is-open");
    };

    close.addEventListener("click", this._closeCallback);
  }

  static get observedAttributes() {
    return ["is-open"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "is-open":
        if (newValue === null) {
          this._div.classList.remove("is-open");
        } else {
          this._div.classList.add("is-open");
        }
        break;
    }
  }
}

customElements.define("modal-dialog", ModalDialog);
