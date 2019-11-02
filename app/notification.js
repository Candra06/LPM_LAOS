const { Notification } = require('electron')
const path = require('path')
class Notif {
  constructor(settings) {
    this.view_dir = path.resolve(__dirname, '..', 'Web')
    this.config = settings
  }

  info(message, title = null) {
    let notifInfo = new Notification({
      title: title == null ? this.config.APP_NAME : title,
      body: message,
      image: path.join(this.view_dir, 'img', 'jumbo.jpg')
    })
    notifInfo.show()
    return notifInfo
  }

  download(message, title = 'Laos Package Manager') {
    let downloadNotif = new Notification({
      title: title,
      body: message
    })
    downloadNotif.show()
    return downloadNotif
  }
}

module.exports = Notif