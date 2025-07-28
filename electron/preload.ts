contextBridge.exposeInMainWorld('invoices', {
  read: (year: string, month: string) => ipcRenderer.invoke('invoices:read', year, month),
  write: (year: string, month: string, invoices: unknown[]) => ipcRenderer.invoke('invoices:write', year, month, invoices),
})
import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

contextBridge.exposeInMainWorld('theme', {
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme: "system" | "dark" | "light") => ipcRenderer.invoke('theme:set', theme),
  getSystemTheme: () => ipcRenderer.invoke('theme:system'),
})

contextBridge.exposeInMainWorld('workspace', {
  getFolder: () => ipcRenderer.invoke('workspace:get'),
  setFolder: (folder: string) => ipcRenderer.invoke('workspace:set', folder),
  pickFolder: () => ipcRenderer.invoke('workspace:pick'),
})