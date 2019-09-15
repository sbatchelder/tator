class EntityButton extends TatorElement {
  constructor() {
    super();

    const div = document.createElement("div");
    div.setAttribute("class", "d-flex flex-justify-between flex-items-center py-1");
    this._shadow.appendChild(div);

    this._label = document.createTextNode("");
    div.appendChild(this._label);

    this._span = document.createElement("span");
    div.appendChild(this._span);

    this._button = document.createElement("button");
    this._button.setAttribute("class", "btn btn-outline btn-small d-flex f2 text-semibold");
    this._button.style.justifyContent = "space-between";
    this._button.style.width = (100 * 8 / 12) + "%";
    div.appendChild(this._button);

    const span = document.createElement("span");
    span.setAttribute("class", "d-flex flex-items-center");
    this._button.appendChild(span);

    this._text = document.createElement("span");
    this._text.setAttribute("class", "px-2 text-white");
    span.appendChild(this._text);

    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("class", "icon-chevron-right");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("height", "1em");
    svg.setAttribute("width", "1em");
    this._button.appendChild(svg);

    const path = document.createElementNS(svgNamespace, "path");
    path.setAttribute("d", "M9.707 18.707l6-6c0.391-0.391 0.391-1.024 0-1.414l-6-6c-0.391-0.391-1.024-0.391-1.414 0s-0.391 1.024 0 1.414l5.293 5.293-5.293 5.293c-0.391 0.391-0.391 1.024 0 1.414s1.024 0.391 1.414 0z");
    svg.appendChild(path);
  }

  static get observedAttributes() {
    return ["label"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "label":
        this._span.parentNode.removeChild(this._span);
        this._label.nodeValue = newValue;
        break;
    }
  }

  set annotationData(val) {
    val.addEventListener("freshData", evt => {
      if (evt.detail.typeObj.type.id === this._dataType.type.id) {
        const name = this._dataType.type.name;
        const count = evt.detail.data.length;
        this._text.textContent = count + " " + name;
      }
    });
  }

  set dataType(val) {
    this._dataType = val;
    this._button.addEventListener("click", evt => {
      this.dispatchEvent(new CustomEvent("open", {
        detail: {id: val.type.id}
      }));
    });
    this._text.textContent = val.count + " " + val.type.name;
  }
}

customElements.define("entity-button", EntityButton);
