/**
 * Simple configuration store for Electron
 */
const path = require('path');
const fs = require('fs');
const electron = require('electron');
const crypto = require('crypto');

// Vom folosi o implementare simplă pentru stocare până când importăm electron-store
class SimpleStore {
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

// Encryption key management
const getEncryptionKey = () => {
  // Use a fixed key for development - in production this should be more secure
  return 'viarom-suppliers-secure-key-2023';
};

// Encryption and decryption functions
const encrypt = (text) => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

const decrypt = (text) => {
  try {
    const key = getEncryptionKey();
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Create the store
const store = new SimpleStore({
  name: 'viarom-suppliers-config'
});

// Initialize default values if needed
if (!store.has('userData')) {
  store.set('userData', null);
}

if (!store.has('dbConfig')) {
  store.set('dbConfig', {
    type: 'local',
    url: 'postgresql://user:pass@localhost:5432/furnizori_dev',
    host: 'localhost',
    port: 5432,
    database: 'furnizori_dev',
    username: 'user',
    password: 'pass'
  });
}

// Helper functions for user data
const getUserData = () => {
  const userData = store.get('userData');
  if (userData && userData.smtp_pass) {
    // Decrypt password if needed
    const decryptedUserData = { ...userData };
    if (userData.smtp_pass.includes(':')) {
      decryptedUserData.smtp_pass = decrypt(userData.smtp_pass);
    }
    return decryptedUserData;
  }
  return userData;
};

const setUserData = (userData) => {
  if (userData && userData.smtp_pass) {
    // Encrypt password
    const encryptedUserData = { ...userData };
    encryptedUserData.smtp_pass = encrypt(userData.smtp_pass);
    store.set('userData', encryptedUserData);
  } else {
    store.set('userData', userData);
  }
  return getUserData(); // Return the saved data
};

const clearUserData = () => {
  store.set('userData', null);
};

// Export the store and helper functions
module.exports = {
  store,
  getUserData,
  setUserData,
  clearUserData,
  getDbConfig: () => store.get('dbConfig'),
  setDbConfig: (config) => store.set('dbConfig', config)
}; 