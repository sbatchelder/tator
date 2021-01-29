class LeafTypeEdit extends SettingsSection {
  constructor() {
    super();
    this.fromType = "LeafType";
    this._shadow.appendChild(this.settingsSectionDiv);
  }

  _init(data){
    console.log(`${this.tagName} init.`);

    this.data = JSON.parse( data );
    if(this.data.length > 0){
      console.log(this.data);

      for(let i in this.data){
        let itemDiv = document.createElement("div");
        itemDiv.id = `itemDivId-leaf-${this.data[i].id}`; //#itemDivId-${type}-${itemId}
        itemDiv.setAttribute("class", "item-box item-group-"+this.data[i].id);
        itemDiv.hidden = true;

        // Section h1.
        const h1 = document.createElement("h1");
        h1.setAttribute("class", "h2 pb-3");
        //h1.innerHTML = `Set media and attribute details.`;
        h1.innerHTML = this.data[i].name;
        itemDiv.appendChild(h1);

        itemDiv.appendChild( this._getSectionForm( this.data[i]) );
        itemDiv.appendChild( this._getSubmitDiv( {"id": this.data[i].id }) );

        this.settingsSectionDiv.appendChild(itemDiv);
      }

      console.log("Init complete : Data length "+this.data.length);
      return this.settingsSectionDiv;
    } else {
      console.log("Init complete : No data.");
    }
  }

  _getSectionForm(data){
    let current = this.boxHelper.boxWrapDefault( {
        "children" : ""
      } );

      // Only editable items inside this form
      const _form = document.createElement("form");
      _form.id = data.id;
      current.appendChild( _form );

      _form.addEventListener("change", (event) => {
        this._formChanged(_form, event);
      });

      // append input for name
      const NAME = "Name";
      _form.appendChild( this.inputHelper.inputText( {
        "labelText": NAME,
        "name": NAME.toLowerCase(),
        "value": data[NAME.toLowerCase()]
      } ) );

      //description
      const DESCRIPTION = "Description";
      _form.appendChild( this.inputHelper.inputText( {
        "labelText": DESCRIPTION,
        "name": DESCRIPTION.toLowerCase(),
        "value": data[DESCRIPTION.toLowerCase()]
      } ) );

      // dtype
      const DTYPE = "Dtype";
      _form.appendChild( this.inputHelper.inputSelectOptions( {
        "labelText": "Data Type",
        "name": DTYPE.toLowerCase(),
        "value": data[DTYPE.toLowerCase()],
        "optionsList" : ["leaf"],
        "disabledInput" : true
      } ) );

      // visible
      const VISIBLE = "Visible";
      _form.appendChild( this.inputHelper.inputRadioSlide({
        "labelText": VISIBLE,
        "name": VISIBLE.toLowerCase(),
        "value": data[VISIBLE.toLowerCase()]
      } ) );

      // attribute types
      if(data.attribute_types.length > 0){
        this.attributeSection = document.createElement("settings-attributes");
        //this.attributeSection._init("LEAF", data.attribute_types);
        this.attributeSection._init(this.fromType, data.id, data.project, data.attribute_types);
        current.appendChild(this.attributeSection);
      }

      return current;
  }

  _getFormData(id){
    let form = this._shadow.getElementById(id);
    // do not send dtype
    // name only if changed || can not be ""
    let name = form.querySelector('[name="name"]').value;

    // description only if changed
    let description = form.querySelector('[name="description"]').value;

    // Visible is a radio slide
    let visibleInputs =  form.querySelectorAll('.radio-slide-wrap input[name="visible"]');
    let visible = this.inputHelper._getSliderSetValue(visibleInputs);

    let formData = {
      name,
      description,
      visible
    };

    return formData;
  }

  reset(scope){
    console.log("Not setup yet [Reset with project data.]");
    //
    return false;
  }

  resetHard(){
    this._fetchNewProjectData();
    this.reset();
  }

  _fetchNewProjectData(){
    return false;
  }

}

customElements.define("leaf-type-edit", LeafTypeEdit);
