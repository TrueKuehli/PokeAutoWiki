export default class MultiSelect {
  constructor(className) {
    this.multiSelects = document.getElementsByClassName(className);
  }

  register() {
    for (let item of this.multiSelects) {
      if (!this.selected) this.selected = item.id;
      item.addEventListener('click', (e) => {
        if (e.target.disabled) return;
        for (let item of this.multiSelects) {
          item.classList.remove('selected');
        }
        e.target.classList.add('selected');
        this.selected = e.target.id;
      });
    }
  }

  getSelection() {
    return this.selected;
  }
}
