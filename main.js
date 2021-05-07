const { app, BrowserWindow, session  } = require('electron')
const { ipcMain } = require('electron')
const path = require('path')

app.disableHardwareAcceleration();
let win;

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
  win = new BrowserWindow({
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      //offscreen: true,
      nodeIntegration: true
    }
  })

  win.loadFile('index.html')
  //win.setIgnoreMouseEvents(true, { forward: true });
  //win.openDevTools(); //fyi: dev tools allow it to resist closing
  win.webContents.on('paint', (event, dirty, image) => {
    fs.writeFileSync('ex.png', image.toPNG())
  });
  win.webContents.setFrameRate(60);

  setInterval(() => {
    let toSend = ""+(Math.random());
    console.log("imma send", toSend);
    win.webContents.send("img", toSend);
  }, 1000)
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