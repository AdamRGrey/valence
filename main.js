const { app, BrowserWindow, session  } = require('electron')
const { ipcMain } = require('electron')
const path = require('path')

app.disableHardwareAcceleration();
let streamInWin;
let theaterWin;

function sessionCooperateWithTwitch(){

  session.defaultSession.webRequest.onBeforeRequest({
      urls: [
        'https://embed.twitch.tv/*channel=*'
      ]
    }, (details, cb) => {
      var redirectURL = details.url;

      var params = new URLSearchParams(redirectURL.replace('https://embed.twitch.tv/',''));
      if (params.get('parent') != '') {
          cb({});
          return;
      }
      params.set('parent', 'locahost');
      params.set('referrer', 'https://localhost/');

      var redirectURL = 'https://embed.twitch.tv/?' + params.toString();
      //console.log('Adjust to', redirectURL);

      cb({
        cancel: false,
        redirectURL
      });
  });

  // works for dumb iFrames
  session.defaultSession.webRequest.onHeadersReceived({
      urls: [
        'https://player.twitch.tv/*',
        'https://embed.twitch.tv/*'
      ]
    }, (details, cb) => {
      var responseHeaders = details.responseHeaders;

      //console.log('headers', details.url, responseHeaders);

      delete responseHeaders['Content-Security-Policy'];
      //console.log(responseHeaders);

      cb({
        cancel: false,
        responseHeaders
      });
  });
}
function createWindow () {
  sessionCooperateWithTwitch();

  streamInWin = new BrowserWindow({
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    width: 1920,
    height: 1080,
    webPreferences: {
      //preload: path.join(__dirname, 'preload.js'),
      offscreen: true,
      nodeIntegration: true
    }
  });
  theaterWin = new BrowserWindow({
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  });

  streamInWin.loadFile('streamview.html');
  streamInWin.webContents.setFrameRate(10);

  theaterWin.loadFile('theater.html');
  //theaterWin.setIgnoreMouseEvents(true, { forward: true });
  theaterWin.webContents.once('dom-ready', () => {
    //TODO: speed
    let frameNum = 0;
    streamInWin.webContents.on('paint', (event, dirty, image) => {
      theaterWin.webContents.send("frame", {
        image:image.toDataURL(),
        frameNum: frameNum
      });
      frameNum++;
    });
  });
  //theaterWin.openDevTools();
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  });
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('perform-action', (event, arg) => {
  //console.log(arg);
  switch(arg){
    case "close":
      app.quit();
    break;
  }
})
ipcMain.on('set-ignore-mouse-events', (event, ...args) => {
  BrowserWindow.fromWebContents(event.sender).setIgnoreMouseEvents(...args)
});