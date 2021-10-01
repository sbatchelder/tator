class MultiSelectionPanel extends TatorElement {
   constructor() {
      super();

      this._bulkEditBar = document.createElement("div");
      this._bulkEditBar.setAttribute("class", "px-6 py-2 d-flex flex-wrap")
      this._shadow.appendChild(this._bulkEditBar);

      let barLeftTop = document.createElement("div");
      barLeftTop.setAttribute("class", "py-2 bulk-edit-bar--left col-6")
      this._bulkEditBar.appendChild(barLeftTop);

      let barRightTop = document.createElement("div");
      barRightTop.setAttribute("class", "py-2 bulk-edit-bar--right col-6 d-flex flex-row flex-items-center flex-justify-right")
      this._bulkEditBar.appendChild(barRightTop);

      let barLeft = document.createElement("div");
      barLeft.setAttribute("class", "py-2 bulk-edit-bar--left col-6")
      this._bulkEditBar.appendChild(barLeft);

      let barRight = document.createElement("div");
      barRight.setAttribute("class", "py-2 bulk-edit-bar--right col-6")
      this._bulkEditBar.appendChild(barRight);

      this._h2 = document.createElement("h2");
      this._h2.setAttribute("class", "py-2 px-2");
      this._h2.textContent = "Selection mode: Select to compare, and/or bulk correct.";
      barLeftTop.appendChild(this._h2);

      this._quickSelectAllDiv = document.createElement("div");
      this._quickSelectAllDiv.setAttribute("class", "py-2 px-2 bulk-edit--quick-select");
      barLeftTop.appendChild(this._quickSelectAllDiv);

      // this._selectAllResults = document.createElement("a");
      // this._selectAllResults.setAttribute("class", "text-purple clickable");
      // this._selectAllResults.textContent = "Select all filter results";
      // this._quickSelectAllDiv.appendChild(this._selectAllResults);

      this._selectAllPage = document.createElement("a");
      this._selectAllPage.setAttribute("class", "text-purple clickable");
      this._selectAllPage.textContent = "Select all on page";
      this._quickSelectAllDiv.appendChild(this._selectAllPage);

      this._clearSelection = document.createElement("a");
      this._clearSelection.setAttribute("class", "text-gray py-2 px-3 clickable");
      this._clearSelection.textContent = "X Clear all selected";
      this._quickSelectAllDiv.appendChild(this._clearSelection);

      // Right = side
      this._selectionSummary = document.createElement("div");
      this._selectionSummary.setAttribute("class", "py-2 px-2 bulk-edit--quick-select")
      barRightTop.appendChild(this._selectionSummary);

      this._selectionCount = document.createElement("span");
      this._selectionCount.textContent = "0";
      this._selectionSummary.appendChild(this._selectionCount);

      this._selectionCountText = document.createElement("span");
      this._selectionCountText.textContent = " localizations selected.";
      this._selectionSummary.appendChild(this._selectionCountText);

      this._compareButton = document.createElement("button");
      this._compareButton.setAttribute("class", "btn btn-clear btn-outline py-2 px-2")
      this._compareButton.textContent = "Compare";
      barLeft.appendChild(this._compareButton);

      this._editButton = document.createElement("button");
      this._editButton.setAttribute("class", "btn btn-clear py-2 px-2  col-12")
      this._editButton.textContent = "Edit";
      barRight.appendChild(this._editButton);


      // EVENT LISTENERS
      this._editButton.addEventListener("click", () => {
         this.dispatchEvent(new Event("bulk-edit-click"));
      });

      this._compareButton.addEventListener("click", () => {
         this.dispatchEvent(new Event("comparison-click"));
      });
      this._clearSelection.addEventListener("click", () => {
         this.dispatchEvent(new Event("clear-selection"));
      });
      this._selectAllPage.addEventListener("click", () => {
         this.dispatchEvent(new Event("select-all"));
      });
   }

   show(val) {
      this.hidden = !val;
   }

   isHidden() {
      return this.hidden;
   }

}
customElements.define("entity-gallery-multi-selection-panel", MultiSelectionPanel);