/**
 * Configuration for electron-builder
 * This file is used by electron-builder to configure the build process
 */

const path = require('path');

/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'com.suppliersdb.app',
  productName: 'Suppliers Database',
  directories: {
    output: 'dist_electron',
    buildResources: 'public'
  },
  files: [
    'dist/**/*',
    'electron/**/*'
  ],
  extraResources: [
    {
      from: path.join(process.cwd(), '..', 'backend'),
      to: 'backend',
      filter: ['**/*', '!__pycache__', '!*.pyc', '!*.pyo', '!*.pyd']
    }
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'public/vite.svg'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Suppliers Database',
    installerIcon: 'public/vite.svg',
    uninstallerIcon: 'public/vite.svg'
  },
  // Include Python with the application
  extraFiles: [
    {
      from: path.join(process.cwd(), '..', 'python-dist'),
      to: 'python',
      filter: ['**/*']
    }
  ],
  // Add any additional dependencies needed for the application
  // This is useful for including native modules
  electronDependencies: [
    'python-shell',
    'electron-store'
  ],
  // Configure publish options if you want to distribute your app
  publish: null
}; 