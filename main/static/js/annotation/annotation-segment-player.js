/**
 * Page specific for the segmented video player.
 */
class AnnotationSegmentPlayer extends TatorPage {
  constructor() {
    super();
    document.body.setAttribute("class", "no-padding-bottom");

    const header = document.createElement("div");
    this._headerDiv = this._header._shadow.querySelector("header");
    header.setAttribute("class", "annotation__header d-flex flex-items-center flex-justify-between px-2 f3");
    const user = this._header._shadow.querySelector("header-user");
    user.parentNode.insertBefore(header, user);

    const div = document.createElement("div");
    div.setAttribute("class", "d-flex flex-items-center");
    header.appendChild(div);

    this._breadcrumbs = document.createElement("annotation-breadcrumbs");
    div.appendChild(this._breadcrumbs);

    this._main = document.createElement("main");
    this._main.setAttribute("class", "d-flex");
    this._shadow.appendChild(this._main);

    this._sidebar = document.createElement("annotation-sidebar");
    this._main.appendChild(this._sidebar);
  }
}