import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as fs from 'fs'
// Theme config path for storing theme preference
const themeConfigPath = path.join(app.getPath('userData'), 'theme-config.json')

ipcMain.handle('theme:get', async () => {
  try {
    if (fs.existsSync(themeConfigPath)) {
      const data = fs.readFileSync(themeConfigPath, 'utf-8')
      const json = JSON.parse(data)
      if (json.theme === 'dark' || json.theme === 'light' || json.theme === 'system') {
        return json.theme
      }
    }
  } catch (error) {
    console.error('Failed to read theme config:', error)
  }
  return 'system'
})

ipcMain.handle('theme:set', async (_event, theme) => {
  try {
    fs.writeFileSync(themeConfigPath, JSON.stringify({ theme }), 'utf-8')
    return true
  } catch {
    return false
  }
})

ipcMain.handle('theme:system', async () => {
  try {
    const systemTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    return systemTheme
  } catch {
    return 'light'
  }
})

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
