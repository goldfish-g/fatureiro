import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as fs from 'fs'
import { dialog } from 'electron'
// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'pt']
// Theme config path for storing theme preference
const configPath = path.join(app.getPath('userData'), 'config.json')
// Helper to read config
function readConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to read config:', error)
  }
  return {}
}

// Helper to write config
function writeConfig(config: Record<string, unknown>) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config), 'utf-8')
    return true
  } catch (error) {
    console.error('Failed to write config:', error)
    return false
  }
}

// Helper to get system language (returns 'en' or 'pt', defaults to 'en')
function getSystemLanguage() {
  const locale = app.getLocale ? app.getLocale() : 'en'
  const lang = locale.split('-')[0].toLowerCase()
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en'
}

ipcMain.handle('theme:get', async () => {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
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

ipcMain.handle('workspace:get', async () => {
  const config = readConfig()
  return config.workspaceFolder || null
})

ipcMain.handle('workspace:set', async (_event, folder: string) => {
  const config = readConfig()
  config.workspaceFolder = folder
  return writeConfig(config)
})

ipcMain.handle('workspace:pick', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const config = readConfig()
    config.workspaceFolder = result.filePaths[0]
    writeConfig(config)
    return config.workspaceFolder
  }
  return null
})

ipcMain.handle('theme:set', async (_event, theme) => {
  try {
    let config: Record<string, unknown> = {}
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      config = JSON.parse(data)
    }
    config.theme = theme
    fs.writeFileSync(configPath, JSON.stringify(config), 'utf-8')
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

// Language handlers
ipcMain.handle('language:get', async () => {
  const config = readConfig()
  let lang = config.language
  if (!lang || !SUPPORTED_LANGUAGES.includes(lang)) {
    lang = getSystemLanguage()
  }
  return lang
})

ipcMain.handle('language:set', async (_event, language: string) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) return false
  const config = readConfig()
  config.language = language
  return writeConfig(config)
})

// Load language strings from assets
ipcMain.handle('language:strings', async () => {
  const config = readConfig()
  let lang = config.language
  if (!lang || !SUPPORTED_LANGUAGES.includes(lang)) {
    lang = getSystemLanguage()
  }
  // Path to assets folder (in src/assets)
  const assetsPath = path.join(process.env.VITE_PUBLIC, 'langs')
  const langFile = path.join(assetsPath, `${lang}.json`)
  try {
    if (fs.existsSync(langFile)) {
      const data = fs.readFileSync(langFile, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to load language file:', error)
  }
  return {}
})

// Invoice storage handlers
ipcMain.handle('invoices:read', async (_event, year: string, month: string) => {
  const config = readConfig()
  const workspaceFolder = config.workspaceFolder
  if (!workspaceFolder) return []
  const yearFolder = path.join(workspaceFolder, year)
  const monthFile = path.join(yearFolder, `${month}.json`)
  try {
    if (fs.existsSync(monthFile)) {
      const data = fs.readFileSync(monthFile, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to read invoices:', error)
  }
  return []
})

ipcMain.handle('invoices:write', async (_event, year: string, month: string, invoices: Invoice[]) => {
  const config = readConfig()
  const workspaceFolder = config.workspaceFolder
  if (!workspaceFolder) return false
  const yearFolder = path.join(workspaceFolder, year)
  const monthFile = path.join(yearFolder, `${month}.json`)
  try {
    if (!fs.existsSync(yearFolder)) {
      fs.mkdirSync(yearFolder, { recursive: true })
    }
    fs.writeFileSync(monthFile, JSON.stringify(invoices, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('Failed to write invoices:', error)
    return false
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


async function ensureWorkspaceFolder() {
  const config = readConfig()
  if (!config.workspaceFolder) {
    const result = await dialog.showOpenDialog({
      title: 'Select Workspace Folder',
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      config.workspaceFolder = result.filePaths[0]
      writeConfig(config)
    } else {
      // User cancelled, quit app
      app.quit()
      return false
    }
  }
  return true
}

async function createWindow() {
  const hasWorkspace = await ensureWorkspaceFolder()
  if (!hasWorkspace) return
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'fatureiro_logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
    },
  })
  win.setMenuBarVisibility(false)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
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
