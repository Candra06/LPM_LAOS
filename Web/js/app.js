const { app, ipcRenderer } = require('electron')

const searchBtn = document.getElementById('searchBtn')
var oriSearchBtn = searchBtn.innerHTML;

searchBtn.addEventListener('click', (e) => {
  e.preventDefault()
  searchQuery = document.getElementById('search-query').value;
  ipcRenderer.send('search-api', searchQuery)
  searchBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...'  
})

ipcRenderer.on('search-api', (e, res) => {
  console.log(res)
  searchBtn.innerHTML = oriSearchBtn
})