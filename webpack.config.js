const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.js',
    serviceWorker: './src/service-worker.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  }
};
