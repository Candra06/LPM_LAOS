const { net } = require('electron')

class API_LPM {

  constructor(settings) {
    this.config = settings
  }

  getQueryBuilder(file, query = '') {
    return `${this.config.API_URL}/${file}?${query}`;
  }
  
  /**
   * search ubuntu package by name
   * https://lpm-api.zhanang.id/detail.php?name=
   */
  searchPackage(query = '') {
    if (query == '') return
    return new Promise ((resolve, reject) => {
      const req = net.request(this.getQueryBuilder('search.php', `keyword=${query}`))
      req.on('response', (res) => {
        res.on('data', (body) => {
          resolve(JSON.parse(body))
        })
        res.on('error', (err) => {
          reject(err)
        })
      })
      req.end()
    })
  }

  /**
   * Detail Package
   */
  detailPackage(packageName) {
    return new Promise ((resolve, reject) => {
      const req = net.request(this.getQueryBuilder('detail.php', `name=${packageName}`))
      req.on('response', (res) => {
        res.on('data', (body) => {
          resolve(JSON.parse(body))
        })
        res.on('error', (err) => {
          reject(err)
        })
      })
      req.end()
    })
  }

  /**
   * Get Download link
   * 
   */
  getAllDebLink(packageName) {
    return new Promise ((resolve, reject) => {
      const req = net.request( this.getQueryBuilder('mirror.php', `name=${packageName}`) )
      req.on('response', (res) => {
        res.on('data', (body) => {
          resolve(JSON.parse(body))
        })
        res.on('error', (err) => {
          reject(err)
        })
      })
      req.end()
    })
  }

  detailApp(query = ''){
    if (query == '') return
    return new Promise ((resolve, reject) => {
      const req = net.request(this.getQueryBuilder('detail.php', `name=${query}`))
      req.on('response', (res) => {
        res.on('data', (body) => {
          resolve(JSON.parse(body))
        })
        res.on('error', (err) => {
          reject(err)
        })
      })
      req.end()
    })
  }
}

module.exports = API_LPM