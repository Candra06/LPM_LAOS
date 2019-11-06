const {
  app,
  shell,
  BrowserWindow,
} = require('electron')
const fs    = require('fs')
const dwm   = require('electron-download-manager')
const path  = require('path')
const ipcCtrl = require(path.join(__dirname, 'ipcCtrl.js'))

const app_config = {
  APP_DIR: app.getPath('userData'),
  APP_NAME: 'Laos Package Manager',
  API_URL: 'https://lpm-api.zhanang.id',
  PACKAGE_DIR: path.join(app.getPath('downloads'), 'alldebs'),
  VIEW_DIR: path.resolve(__dirname, '..', 'Web'),
  TEMP_DIR: path.resolve(app.getPath("temp"), "lpm")
}

console.log(app_config)

let mainWindow, splashWindow;

function appInit() {

  /**
   * Linux only
   */
  if (process.platform != 'linux') app.quit()
  
  // Create archive dir.
  if (!fs.existsSync(app_config.PACKAGE_DIR)) fs.mkdirSync(app_config.PACKAGE_DIR)
  // Create temp dir. for installation
  if (!fs.existsSync(app_config.TEMP_DIR)) fs.mkdirSync(app_config.TEMP_DIR)

  // download manager
  dwm.register({
    downloadFolder: app_config.PACKAGE_DIR
  });
  
  createSplashWindow()
  createWindow()
  ipcCtrl({
    app_config,
    dwm,
    shell,
    mainWindow
  })
}


/**
 * Splash Screen
 */
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    },
    type: 'splash',
    position: 'center',
    
  })
  splashWindow.loadFile(path.join(app_config.VIEW_DIR, 'splash.html'))
  splashWindow.webContents.on('did-finish-load', () => {
    splashWindow.show()
  })
  splashWindow.on('closed', () => {
    splashWindow = null;
  })

}

/**
 * Main Window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 850,
    height: 600,
    parent: true,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  app.setName(app_config.APP_NAME)
  mainWindow.setTitle(app_config.APP_NAME)
  mainWindow.setMenuBarVisibility(false)
  mainWindow.loadFile( path.join(app_config.VIEW_DIR, 'index.html') )
  // mainWindow.webContents.openDevTools()
  mainWindow.on('close', function () {
    mainWindow = null;
  })
  
  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      splashWindow != null ? splashWindow.close() : null
      mainWindow.show()
    }, 2e3);
  })
}

app.on('ready', appInit)

app.on('window-all-closed', function () {
  if (process.platform != 'darwin') app.quit();
});

app.on('active', function () {
  if (mainWindow == null) createWindow();
})
