import { TatorElement } from "../components/tator-element.js";

export class AlgorithmMenu extends TatorElement {
  constructor() {
    super();

    this._algorithmButtons = document.createElement("div");
    this._algorithmButtons.setAttribute("class", "d-flex flex-column px-4 py-3 lh-condensed");
    this._shadow.appendChild(this._algorithmButtons);
  }

  set algorithms(val) {

    for (let algorithm of val) {
      const button = document.createElement("button");
      button.setAttribute("class", "btn-clear py-2 px-0 text-gray hover-text-white d-flex flex-items-center");
      button.style.textAlign = "left";
      this._algorithmButtons.appendChild(button);

      const span = document.createElement("span");
      span.setAttribute("class", "px-2");
      span.textContent = algorithm.name;
      button.appendChild(span);

      button.addEventListener("click", evt => {
        this.dispatchEvent(new CustomEvent("algorithmMenu", {
          detail: {algorithmName: algorithm.name},
          composed: true
        }));
      });
    }
  }
}

if (!customElements.get("algorithm-menu")) {
  customElements.define("algorithm-menu", AlgorithmMenu);
}
