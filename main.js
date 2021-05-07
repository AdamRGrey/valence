const { app, BrowserWindow, session  } = require('electron')
const path = require('path')

let win;

function createWindow () {

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


  win = new BrowserWindow({
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })

  win.loadFile('index.html')
  //win.setIgnoreMouseEvents(true, { forward: true });
  //win.openDevTools(); //fyi: dev tools allow it to resist closing somehow
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const { ipcMain } = require('electron')

ipcMain.on('perform-action', (event, arg) => {
  console.log(arg);
  switch(arg){
    case "close":
      win.close();
    break;
  }
})
ipcMain.on('set-ignore-mouse-events', (event, ...args) => {
  BrowserWindow.fromWebContents(event.sender).setIgnoreMouseEvents(...args)
})