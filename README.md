# Laos Package Manager

Laos Package Manager adalah tool yang dibangun dari electron untuk menginstall aplikasi beserta dependency yang dibutuhkan.

### Installation

LPM membutuhkan [Node.js](https://nodejs.org/) v4+ dan [Electron](https://electronjs.org) v6+.

Clone repository dan install appnya.

Windows development:
```sh
$ git clone https://github.com/Candra06/LPM_LAOS.git
$ cd LPM_LAOS
$ npm install
$ npm start
```

Linux:
```sh
$ git clone https://github.com/Candra06/LPM_LAOS.git
$ cd LPM_LAOS
$ npm install
$ sudo chown root node_modules/electron/dist/chrome-sandbox
$ sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
$ npm start
```