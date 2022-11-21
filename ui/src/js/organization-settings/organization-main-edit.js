import { OrgTypeFormTemplate } from "./components/org-type-form-template.js";

export class OrganizationMainEdit extends OrgTypeFormTemplate {
  constructor() {
    super();

    //
    this.typeName = "Organization";
    this.readableTypeName = "Organization";
    this._hideAttributes = true;

    // 
    var templateInner = document.getElementById("organization-edit");
    var innerClone = document.importNode(templateInner.content, true);
    this._shadow.appendChild(innerClone);

    this._form = this._shadow.getElementById("organization-edit--form");
    this._thumbUpload = this._shadow.getElementById("organization-edit--thumb");
    this._editName = this._shadow.getElementById("organization-edit--name");
  }

  // overrides templates
  setOrganizationId(newId, oldId) {
    this.organizationId = newId;
    this._thumbUpload.organizationId = newId;
  }
  
  async _setupFormUnique() {
    // Thumb
    this._thumbUpload.setValue(this._data.thumb);
    this._thumbUpload.default = this._data.thumb === null ? "" : this._data.thumb;

    // Input for name
    this._editName.setValue(this._data.name);
    this._editName.default = this._data.name;
  }

  // save and formdata
  _getFormData() {
    let formData = {};

    if (this._thumbUpload.changed()) {
      formData.thumb = this._thumbUpload.getValue();
    }

    if (this._editName.changed()) {
      formData.name = this._editName.getValue();
    }

    return formData;
  }

}

customElements.define("organization-main-edit", OrganizationMainEdit);
