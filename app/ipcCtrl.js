const {ipcMain, dialog} = require('electron')
const { execFile }      = require('child_process')
const md5File = require('md5-file')
const slugify = require('slugify')
const Store = require('electron-store')
const path  = require('path')
const Notif = require(path.join(__dirname, 'notification.js'))
const API_LPM = require(path.join(__dirname, 'api.js'))

let download = {
  history: new Store({
    name: 'download_history'
  }),
  progress: new Store({
    name: 'download_progress',
  })
}

function ipcCtrl (conf) {
  let API = new API_LPM(conf.app_config)
  let notif = new Notif(conf.app_config)
    
  var errHandler = (err) => {
    console.log(err)
    notif.info(err, 'LPM - Error!')
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

  /**
   * Detail Package
   */
  ipcMain.on('detail-package', (e, packageName) => {
    API.detailPackage(packageName).then((res) => {
      e.reply('detail-package', res)
    }, errHandler).catch(errHandler)
  })

  ipcMain.on('add-download', (e, packageName) => {
    let dwnHandler = (res) => {
      if (! res.status) {
        console.log(packageName, res)
        notif.info(`${packageName} tidak ditemukan`)
        return
      }
      
      notif.info(`Download ${packageName} telah dimulai.`)
      packageName = slugify(res.data.name)
      let appData = res.data

      download.progress.set(packageName, appData)
      conf.dwm.download({
        url: appData.link,
        onProgress: progressCallback
      }, dwnCallback)

      // Download progress handler
      function progressCallback(dProgress) {
        let appProgress = download.progress.get(packageName)
        appProgress.progress = dProgress
        download.progress.set(packageName, appProgress)
        conf.mainWindow.webContents.send('download-progress', download.progress.get())
        conf.mainWindow.webContents.send('download-list', listDownload(e))
      }

      // Download handler start - end
      function dwnCallback(err, pathInfo) {
        if (err) {
          notif.info(`Download ${packageName} gagal - ${err}`)
          return
        }

        // download complete
        notif.info(`Download ${packageName} selesai`)
        let appProgress = download.progress.get(packageName);
        appProgress.detail.currentMD5 = md5File.sync(pathInfo.filePath)
        download.history.set(packageName, {
          created_at: + new Date(),
          savedPath: pathInfo.filePath,
          info: appProgress
        })
        // move from progressStorage to historyStorage
        download.progress.delete(packageName)
        listDownload(e)
      }
    }
    API.getAllDebLink(packageName).then(dwnHandler).catch(errHandler)
  })

  ipcMain.on('delete-download', (e, packageName) => {
    if (download.history.has(packageName)) {
      download.history.delete(packageName)
    } else if (download.progress.has(packageName)) {
      download.progress.delete(packageName)
    }
    listDownload(e)
  })

  ipcMain.on('download-list', listDownload)
  function listDownload(e) {
    e.reply('download-list', {
      'progress': download.progress.get(),
      'history': download.history.get()
    })
  }
}

module.exports = ipcCtrl