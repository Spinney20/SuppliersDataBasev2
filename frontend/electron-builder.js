/**
 * Configurație pentru electron-builder
 */
module.exports = {
  appId: 'com.suppliersdb.app',
  productName: 'Suppliers Database',
  files: [
    'dist/**/*',
    'electron/**/*'
  ],
  directories: {
    buildResources: 'public',
    output: 'dist_electron'
  },
  extraResources: [
    {
      from: '../backend',
      to: 'backend'
    }
  ],
  win: {
    target: 'nsis',
    icon: 'public/vite.svg'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true
  }
}; 