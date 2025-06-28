/**
 * Database configuration utilities for Electron
 */
const { dialog } = require('electron');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Initialize store for database configuration
const store = new Store({
  name: 'db-config',
  schema: {
    dbConfig: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['local', 'neon', 'server'] },
        url: { type: 'string' },
        host: { type: 'string' },
        port: { type: 'number' },
        database: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string' }
      }
    }
  }
});

// Set default database config if not exists
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
  return store.get('dbConfig');
}

/**
 * Save database configuration
 * @param {Object} config - Database configuration
 */
function saveDbConfig(config) {
  store.set('dbConfig', config);
}

module.exports = {
  getDbConfig,
  saveDbConfig,
  testConnection
}; 