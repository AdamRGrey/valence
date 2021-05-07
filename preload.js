const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }

  document.querySelector("#close-button").addEventListener("click", () => {
	console.log(ipcRenderer.send('perform-action', 'close'))
  })
  const el = document.querySelector("#close-button")
	el.addEventListener('mouseenter', () => {
	  ipcRenderer.send('set-ignore-mouse-events', false)
	})
	el.addEventListener('mouseleave', () => {
	  ipcRenderer.send('set-ignore-mouse-events', true, { forward: true })
	})
})