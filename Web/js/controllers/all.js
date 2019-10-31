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
    $scope.searching = true
  }
  
  $scope.loading = true
  ipcRenderer.on('search-api', (e, res) => {
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
  ipcRenderer.on('detail-package', (e, res) => {
    $scope.result = res
    $scope.loading = false
    $rootScope.$apply()

  })

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
