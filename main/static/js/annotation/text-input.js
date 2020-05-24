class TextInput extends TatorElement {
  constructor() {
    super();

    const label = document.createElement("label");
    label.setAttribute("class", "d-flex flex-justify-between flex-items-center py-1");
    this._shadow.appendChild(label);

    this._name = document.createTextNode("");
    label.appendChild(this._name);

    this._input = document.createElement("input");
    this._input.setAttribute("class", "form-control input-sm col-8");
    this._input.setAttribute("type", "text");
    label.appendChild(this._input);

    this._input.addEventListener("change", () => {
      if (this.getValue() === null) {
        this._input.classList.add("has-border");
        this._input.classList.add("is-invalid");
      } else {
        this._input.classList.remove("has-border");
        this._input.classList.remove("is-invalid");
      }
      this.dispatchEvent(new Event("change"));
    });

    this.getValue = this._validateString;

    this._input.addEventListener("focus", () => {
      document.body.classList.add("shortcuts-disabled");
    });

    this._input.addEventListener("blur", () => {
      document.body.classList.remove("shortcuts-disabled");
    });

  }

  static get observedAttributes() {
    return ["name", "type"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "name":
        this._name.nodeValue = newValue;
        break;
      case "type":
        switch (newValue) {
          case "int":
            this._input.setAttribute("placeholder", "Enter an integer");
            this.getValue = this._validateInt;
            break;
          case "float":
            this._input.setAttribute("placeholder", "Enter a number");
            this.getValue = this._validateFloat;
            break;
          case "string":
            this.getValue = this._validateString;
            break;
          case "datetime":
            this._input.setAttribute("placeholder", "e.g. 1999-01-01");
            this.getValue = this._validateDateTime;
            break;
          case "geopos":
            this._input.setAttribute("placeholder", "e.g. 42.36,-71.06");
            this.getValue = this._validateGeopos;
            break;
        }
        break;
    }
  }

  set permission(val) {
    if (hasPermission(val, "Can Edit")) {
      this._input.removeAttribute("readonly");
    } else {
      this._input.setAttribute("readonly", "");
    }
  }

  set default(val) {
    this._default = val;
  }

  reset() {
    // Go back to default value
    if (typeof this._default !== "undefined") {
      this.setValue(this._default);
    } else {
      this.setValue("");
    }
  }

  _validateInt() {
    let val = parseInt(this._input.value);
    if (isNaN(val)) {
      val = null;
    }
    return val;
  }

  _validateFloat() {
    let val = parseFloat(this._input.value);
    if (isNaN(val)) {
      val = null;
    }
    return val;
  }

  _validateString() {
    return this._input.value;
  }

  _validateDateTime() {
    let val = new Date(this._input.value);
    if (isNaN(val.getTime())) {
      val = null;
    } else {
      val = val.toISOString();
    }
    return val;
  }

  _validateGeopos() {
    const val = this._input.value.split(",");
    let ret = null;
    if (val.length == 2) {
      const lat = parseFloat(val[0]);
      const lon = parseFloat(val[1]);
      if (!isNaN(lat) && !isNaN(lon)) {
        const latOk = (lat < 90.0) && (lat > -90.0);
        const lonOk = (lon < 180.0) && (lon > -180.0);
        if (latOk && lonOk) {
          ret = [lat, lon];
        }
      }
    }
    return ret;
  }

  setValue(val) {
    this._input.value = val;
  }

  set autocomplete(config)
  {
    TatorAutoComplete.enable(this._input, config);
  }
}

customElements.define("text-input", TextInput);
