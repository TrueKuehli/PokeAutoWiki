export default class FileImporter {
  constructor(fileInput, submitBtn, btnLabel, notificationsHandler, uiMan) {
    this.fileInput = document.getElementById(fileInput);
    this.submitBtn = document.getElementById(submitBtn);
    this.btnLabel = document.getElementById(btnLabel);
    this.notifications = notificationsHandler;
    this.uiManager = uiMan;
  }

  extractData(callback) {
    this.uiManager.disable();

    let fileList = this.fileInput.files;

    if (fileList.length < 1) {
      this.notifications.show('No file received.');
      this.uiManager.enable();
      return 1;
    }

    let file = fileList[0];
    if (file.size > 104857600) {
      this.notifications.show('File size cannot exceed 100MB.');
      this.uiManager.enable();
      return 2;
    }

    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);

    fileReader.addEventListener('load', () => {
      let data = new Uint8Array(fileReader.result);
      callback(data);
    });

    this.notifications.hide();

    return fileReader;
  }

  register(callback = function() {}) {
    // If a file is already in the upload container, initialize text
    let fileList = this.fileInput.files;
    let name;
    if (fileList.length > 0) {
      name = fileList[0].name;
    } else {
      name = 'Upload ROM-File';
    }
    this.btnLabel.innerText = name;

    // Registering file upload event, update file name when uploading
    this.fileInput.addEventListener('change', () => {
      let fileList = this.fileInput.files;
      let name;
      if (fileList.length > 0) {
        name = fileList[0].name;
      } else {
        name = 'Upload ROM-File';
      }
      this.btnLabel.innerText = name;
    });

    // Registering submit event
    this.submitBtn.addEventListener('click', () => {
      this.extractData(callback);
    });
  }
}
