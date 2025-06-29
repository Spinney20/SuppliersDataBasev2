/**
 * Database configuration utilities for Electron
 */
const { dialog } = require('electron');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');

// Implementare simplă pentru stocare
class SimpleStore {
  constructor(options) {
    const electron = require('electron');
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    this.path = path.join(userDataPath, options.name + '.json');
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

// Try to read DATABASE_URL from .env file in backend directory
function getEnvDatabaseUrl() {
  try {
    const envPath = path.join(process.cwd(), '..', 'backend', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/DATABASE_URL=(.+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch (error) {
    console.error('Error reading .env file:', error);
  }
  return 'postgresql://user:password@localhost:5432/furnizori_dev';
}

// Initialize store for database configuration
const dbStore = new SimpleStore({
  name: 'db-config'
});

// Set default database config if not exists
if (!dbStore.has('dbConfig')) {
  // Get database URL from environment
  const dbUrl = getEnvDatabaseUrl();
  
  // Parse components from URL (for display purposes)
  let host = 'localhost';
  let port = 5432;
  let database = 'furnizori_dev';
  let username = 'user';
  
  try {
    const urlObj = new URL(dbUrl);
    host = urlObj.hostname || host;
    port = parseInt(urlObj.port) || port;
    database = urlObj.pathname.replace(/^\//, '') || database;
    username = urlObj.username || username;
  } catch (error) {
    console.error('Error parsing database URL:', error);
  }
  
  dbStore.set('dbConfig', {
    type: 'local',
    url: dbUrl,
    host,
    port,
    database,
    username,
    password: '********' // Password is hidden for security
  });
}

/**
 * Test database connection
 * @param {Object} config - Database configuration
 * @returns {Promise<boolean>} - Connection success
 */
async function testConnection(config) {
  return new Promise((resolve, reject) => {
    const isDev = !process.resourcesPath;
    
    // Determine the path to the Python script
    let scriptPath;
    if (isDev) {
      scriptPath = path.join(process.cwd(), '..', 'backend', 'test_connection.py');
      
      // Create test_connection.py if it doesn't exist
      if (!fs.existsSync(scriptPath)) {
        const testScript = `
import sys
import os
import psycopg2

# Get the database URL from command line argument
db_url = sys.argv[1]

try:
    # Try to connect to the database
    conn = psycopg2.connect(db_url)
    conn.close()
    print("Connection successful")
    sys.exit(0)
except Exception as e:
    print(f"Connection failed: {str(e)}")
    sys.exit(1)
`;
        fs.writeFileSync(scriptPath, testScript);
      }
    } else {
      scriptPath = path.join(process.resourcesPath, 'backend', 'test_connection.py');
    }

    // Set up options for the Python process
    const options = {
      mode: 'text',
      pythonOptions: ['-u'], // unbuffered output
      args: [config.url]
    };

    // Run the Python script
    PythonShell.run(scriptPath, options, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Get database configuration
 * @returns {Object} - Database configuration
 */
function getDbConfig() {
  return dbStore.get('dbConfig');
}

/**
 * Save database configuration
 * @param {Object} config - Database configuration
 */
function saveDbConfig(config) {
  dbStore.set('dbConfig', config);
}

module.exports = {
  getDbConfig,
  saveDbConfig,
  testConnection
}; 