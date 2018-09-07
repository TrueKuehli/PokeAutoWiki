export default class BannerController {
  constructor(bannerId, textP, dismissBtn) {
    this.banner = document.getElementById(bannerId);
    this.bannerText = document.getElementById(textP);
    this.dismissBtn = document.getElementById(dismissBtn);

    // Removing inline hiding to fall back to css
    this.banner.style.removeProperty('display');
  }

  register() {
    this.dismissBtn.addEventListener('click', () => {
      this.banner.classList.add('hidden');
    });
  }

  show(text) {
    this.banner.classList.remove('hidden');
    this.bannerText.innerText = text;
  }

  hide() {
    this.banner.classList.add('hidden');
  }
}
