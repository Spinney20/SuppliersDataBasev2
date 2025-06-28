/**
 * Simple configuration store for Electron
 */
const path = require('path');
const fs = require('fs');
const electron = require('electron');

class Store {
  constructor(options) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    this.path = path.join(userDataPath, options.name + '.json');
    this.schema = options.schema || {};
    this.data = this.parseDataFile();
  }

  // Get a value from the store
  get(key) {
    return this.data[key];
  }

  // Set a value in the store
  set(key, value) {
    this.data[key] = value;
    this.writeDataFile();
    return true;
  }

  // Check if a key exists in the store
  has(key) {
    return Object.prototype.hasOwnProperty.call(this.data, key);
  }

  // Delete a key from the store
  delete(key) {
    delete this.data[key];
    this.writeDataFile();
    return true;
  }

  // Parse the data file
  parseDataFile() {
    try {
      if (fs.existsSync(this.path)) {
        return JSON.parse(fs.readFileSync(this.path, 'utf8'));
      }
      return {};
    } catch (error) {
      console.error('Error reading or parsing the store file:', error);
      return {};
    }
  }

  // Write data to the file
  writeDataFile() {
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error writing to the store file:', error);
    }
  }
}

module.exports = Store; 