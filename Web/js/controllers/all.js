const { ipcRenderer } = require('electron')

lpm.controller('homeController', function ($scope) {
  const searchBtn = $('#searchBtn') //document.getElementById('searchBtn')
  var oriSearchBtn = searchBtn.html() //searchBtn.innerHTML;

  searchBtn.on('click', (e) => {
    e.preventDefault()
    searchQuery = $('#search-query').val() //document.getElementById('search-query').value;
    ipcRenderer.send('search-api', searchQuery)
    searchBtn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...')
  })

  ipcRenderer.on('search-api', (e, res) => {
    console.log(res)
    searchBtn.html(oriSearchBtn)
  })
})

lpm.controller('installedController', function ($scope, $rootScope) {
  ipcRenderer.send('list-installed')
  $scope.packages = ["Loading..."]
  $scope.totalInstalled = 0
  ipcRenderer.on('list-installed', (e, res) => {
    var installedPackages = res.trim().split("\n")
    installedPackages.shift() // Remove "Listing..."
    $scope.totalInstalled = installedPackages.length
    $scope.packages = installedPackages
    $rootScope.$apply(installedPackages)
  });
})