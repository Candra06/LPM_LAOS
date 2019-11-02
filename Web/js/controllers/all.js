const { ipcRenderer } = require('electron')

/**
 * Taken from Stackoverflow
 * Karena disini protokol yang digunakan adalah file,
 * untuk mengambil parameter url hasil dari form sementara 
 * tidak menggunakan $routeParams
 * params.has('query') // boolean => true | false
 * params.get('query') // ?query=asd => asd 
 * e.g: file:///xxx/index.html/?query=bless#/search
 * @link https://stackoverflow.com/a/42316411
 */
const params = new Map(location.search.slice(1).split('&').map(kv => kv.split('=')))

var timeoutHandler;
var timeoutCallback = function() {
  alert('Timeout, please try again or check your internet connection');
}

/**
 * Home controller
 */
lpm.controller('homeController', function ($scope) {
  ipcRenderer.send('online-check', window.navigator.onLine ? 'on' : 'off')
})


  searchBtn.on('click', (e) => {
    e.preventDefault()
    searchQuery = $('#search-query').val() //document.getElementById('search-query').value;
    ipcRenderer.send('search-app', searchQuery)
    searchBtn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...')

/**
 * Search controller
 * untuk pencarian package / app
 */
lpm.controller('searchController', function ($scope, $rootScope) {
 
  $scope.query = params.has('query') ? params.get('query') : ''
  ipcRenderer.send('search-api', $scope.query)
  $scope.searchHandler = () => {
    params.set('query', $scope.query)
    ipcRenderer.send('search-api', $scope.query)
    timeoutHandler = setTimeout(timeoutCallback, 20e3)
    $scope.searching = true
  }
  
  $scope.loading = true
  ipcRenderer.on('search-api', (e, res) => {
    clearTimeout(timeoutHandler)
    $scope.result = res
    $scope.loading = false
    $scope.searching = false
    $scope.searchThis = (index) => {
      $scope.query = res.data.related_results[index]
      $scope.searchHandler()
    }
    $rootScope.$apply()

  })
})


  ipcRenderer.on('search-app', (e, res) => {
    console.log(res)
    searchBtn.html(oriSearchBtn)

/**
 * Detail packages
 * info detial mengenai aplikasi
 */
lpm.controller('detailController', function($scope, $routeParams, $rootScope) {
  
  $scope.package = $routeParams.appName
  $scope.loading = true
  ipcRenderer.send('detail-package', $scope.package)
  timeoutHandler = setTimeout(timeoutCallback, 20e3)
  ipcRenderer.on('detail-package', (e, res) => {
    clearTimeout(timeoutHandler)
    $scope.result = res
    $scope.loading = false
    $rootScope.$apply()

  })

  $scope.sendDownloadQueue = function () {
    ipcRenderer.send('add-download', $routeParams.appName)
  }

})

lpm.controller('downloadController', function($scope, $rootScope) {
  
  ipcRenderer.send('download-list')
  ipcRenderer.on('download-list', (e, res) => {
    let his = [], pro = [];
    for (x in res.history) his.push(res.history[x])
    for (x in res.progress) pro.push(res.progress[x])
    $scope.history = his
    $scope.progress = pro
    console.log(pro)
    $rootScope.$apply()
  })

  ipcRenderer.on('download-progress', (e, res) => {
    let p = [];
    for (x in res) {
      p.push(res[x])
    }
    $scope.progress = p;
    // for (y in $scope.progress) console.log(y)
    $rootScope.$apply()
  })

  $scope.formatDate = function(unix) {
    return new Date(unix).toLocaleDateString('id-ID');
  }

  $scope.removeItem = function(packageName) {
    ipcRenderer.send('delete-download', packageName)
  }
})

/**
 * Installed packages
 * untuk list aplikasi yang terinstall
 */
lpm.controller('installedController', function ($scope, $rootScope) {
  ipcRenderer.send('list-installed')
  $scope.packages = ["Loading..."]
  $scope.totalInstalled = 0
  ipcRenderer.on('list-installed', (e, res) => {
    var installedPackages = res.trim().split("\n")
    installedPackages.shift() // Remove "Listing..."
    $scope.totalInstalled = installedPackages.length
    $scope.packages = installedPackages
    $rootScope.$apply()
  });
})
