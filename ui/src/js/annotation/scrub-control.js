import { TatorElement } from "../components/tator-element.js";

export class ScrubControl extends TatorElement {
  constructor() {
    super();

    const summary = document.createElement("summary");
    summary.style.cursor = "pointer";
    summary.setAttribute("class", "d-flex flex-items-center rounded-1");
    this._shadow.appendChild(summary);

    const div = document.createElement("div");
    div.setAttribute("class", "px-1");
    summary.appendChild(div);

    const select = document.createElement("select");
    select.setAttribute("class", "form-select has-border select-sm1");
    div.appendChild(select);
    this._select = select;

    const choices = ["Play", "Load", "Summary"];
    for (const choice of choices)
    {
      let option = document.createElement("option");
      option.setAttribute("value", choice);
      option.textContent = choice;
      select.append(option);
    }
    select.selectedIndex = 0; // Play
    select.addEventListener("change", evt => {
      const choice = evt.target.value;

      if (choice == "Play") {
        this.dispatchEvent(new Event("play"));
      }
      else if (choice == "Load") {
        this.dispatchEvent(new Event("load"));
      }
      else if (choice == "Summary") {
        this.dispatchEvent(new Event("summary"));
      }
    });
  }

  static get observedAttributes() {
    return ["class", "disabled"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "disabled":
        if (newValue === null) {
          this._select.removeAttribute("disabled");
        } else {
          this._select.setAttribute("disabled", "");
        }
        break;
    }
  }
}

customElements.define("scrub-control", ScrubControl);
