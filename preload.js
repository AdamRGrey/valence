const { ipcRenderer } = require('electron')
let receiver;

window.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector("#close-button");
  el.addEventListener("click", () => {
    ipcRenderer.send('perform-action', 'close');
  })
	el.addEventListener('mouseenter', () => {
	  ipcRenderer.send('set-ignore-mouse-events', false)
	})
	el.addEventListener('mouseleave', () => {
	  ipcRenderer.send('set-ignore-mouse-events', true, { forward: true })
	});

  receiver = document.querySelector("#receiver");
  let currFrame = -1;
  ipcRenderer.on("frame", (event, arg) => {
    if(arg.frameNum > currFrame){
      currFrame = arg.frameNum;
      receiver.src = arg.image;  
    }
  });
});
