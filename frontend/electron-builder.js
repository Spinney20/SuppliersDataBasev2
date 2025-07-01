/**
 * Configurație pentru electron-builder
 */
module.exports = {
  appId: 'com.furnivia.app',
  productName: 'FurniVIA',
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
    icon: 'public/icons/icon.ico'
  },
  mac: {
    icon: 'public/icons/icon.icns',
    category: 'public.app-category.business'
  },
  linux: {
    icon: 'public/icons',
    category: 'Office'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    installerIcon: 'public/icons/icon.ico',
    uninstallerIcon: 'public/icons/icon.ico'
  }
}; 