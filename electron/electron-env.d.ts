/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

interface Invoice {
  id: string
  number: string
  atcud: string
  nif: string
  date: string
  amount: number
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer,
  theme: {
    getTheme: () => Promise<"system" | "dark" | "light">;
    setTheme: (theme: "system" | "dark" | "light") => Promise<boolean>;
    getSystemTheme: () => Promise<"dark" | "light">;
  };
  workspace: {
    getFolder: () => Promise<string | null>
    setFolder: (folder: string) => Promise<boolean>
    pickFolder: () => Promise<string | null>
  };
  invoices: {
    read: (year: string, month: string) => Promise<Invoice[]>
    write: (year: string, month: string, invoices: Invoice[]) => Promise<boolean>
  },
  language: {
    getLanguage: () => Promise<'en' | 'pt'>
    setLanguage: (lang: 'en' | 'pt') => Promise<void>
    getStrings: () => Promise<Record<string, string>>
  },
  app: {
    closeApp: () => Promise<void>
    minimizeApp: () => Promise<void>
    maximizeApp: () => Promise<void>
  }
}
