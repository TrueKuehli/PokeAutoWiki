export default class FileImporter {
  constructor(fileInput, submitBtn) {
    this.fileInput = document.getElementById(fileInput);
    this.submitBtn = document.getElementById(submitBtn);
  }

  extractData(callback = function() {}) {
    let fileList = this.fileInput.files;
    if (fileList.length < 1) {
      // TODO: Show error message
      console.log('No file received.');
      return 1;
    }

    let file = fileList[0];
    if (file.size > 104857600) {
      // TODO: Show error message
      console.log('File size exceeds 100MB');
      return 2;
    }

    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);

    fileReader.addEventListener('load', () => {
      let data = new Uint8Array(fileReader.result);
      callback(data);
    });

    return fileReader;
  }

  register() {
    this.submitBtn.addEventListener('click', () => {
      this.extractData();
    });
  }
}
