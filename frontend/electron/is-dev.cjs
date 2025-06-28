'use strict';

// Simple module to check if Electron is running in development mode
const isDev = process.env.ELECTRON_IS_DEV === '1' || 
              process.defaultApp || 
              /node_modules[\\/]electron[\\/]/.test(process.execPath) ||
              process.env.NODE_ENV === 'development';

module.exports = isDev; 