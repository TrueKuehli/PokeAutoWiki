export default class UIManager {
  constructor(...classes) {
    this.uiElements = [];
    for (let elt of classes) {
      if (typeof elt != 'string') continue;
      this.uiElements.push(...document.getElementsByClassName(elt));
    }
  }

  disable() {
    for (let elt of this.uiElements) {
      elt.classList.add('disabled');
      elt.disabled = true;
    }
  }

  enable() {
    for (let elt of this.uiElements) {
      elt.classList.remove('disabled');
      elt.disabled = false;
    }
  }
}
