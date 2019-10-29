const {ipcMain, dialog} = require('electron')
const path = require('path')
const { execFile } = require('child_process') 
var API_LPM = require(path.join(__dirname, 'api.js'))
const Notif = require(path.join(__dirname, 'notification.js'))

function ipcCtrl (app_config) {
  let API = new API_LPM(app_config)
  let notif = new Notif(app_config)
    
  var errHandler = (err) => {
    Notif.info(err, 'LPM - Error!')
    dialog.showErrorBox('Error!', err)
  }
  
  /**
   * Search Package
   */
  ipcMain.on('search-api', (e, packageName) => {
    API.searchPackage(packageName.trim()).then((res) => {
      e.reply('search-api', res)
    }, errHandler).catch(errHandler)
  })

  /**
   * List Installed Packages
   */
  ipcMain.on('list-installed', (e) => {
    execFile('apt', ['list', '--installed'], (err, stdout, stderr) => {
      if (err) {
        e.reply('list-installed', 'Failed to fetch installed packages')
        console.log(stderr)
        return
      }
      e.reply('list-installed', stdout)
    })
  })

  ipcMain.on('download-package', (e, packageName) => {
    API.downloadPackage(packageName.trim()).then((res) => {
      console.log(res)
      Notif.info(`Download ${packageName} telah dimulai`)
    }).catch(errHandler)
  })

  ipcMain.on('search-app', (e, appName) => {
    API.searchApp(appName.trim()).then((res) => {
      console.log(res)
      Notif.info(`Search ${appName}`)
    }).catch(errHandler)
  })

  ipcMain.on('detail-app', (e, appName) => {
    API.detailApp(appName.trim()).then((res) => {
      console.log(res)
      Notif.info(`Detail ${appName}`)
    }).catch(errHandler)
  })
}

module.exports = ipcCtrl