import { TatorElement } from "../components/tator-element.js";

export class ScrubControl extends TatorElement {
  constructor() {
    super();

    this._btn = document.createElement("button");
    this._btn.textContent = "Play";
    this._shadow.appendChild(this._btn);

    this._btn.addEventListener("click", () => {
      this._btn.blur();
      if (this._mode == "Play") {
        this.setValue("Summary");
        this.dispatchEvent(new Event("summary"));
      }
      else {
        this.setValue("Play");
        this.dispatchEvent(new Event("play"));
      }
    });

    this._mode = "Play";
    this.setValue(this._mode);
  }

  setValue(val) {
    if (val == "Play") {
      this._btn.textContent = "Play";
      this._btn.setAttribute("class", "btn btn-small-height btn-fit-content btn-outline btn-clear f3 text-gray text-semibold text-uppercase px-2");
      this._mode = "Play";
    }
    else if (val == "Summary") {
      this._btn.textContent = "Summary";
      this._btn.setAttribute("class", "btn btn-small-height btn-fit-content btn-purple50 btn-clear f3 text-semibold text-uppercase px-2");
      this._mode = "Summary";
    }
  }
}

customElements.define("scrub-control", ScrubControl);
