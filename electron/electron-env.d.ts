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

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer,
  theme: {
    initialShouldUseDarkColors: boolean;
    initialTheme: "system" | "dark" | "light";
    getTheme?: () => Promise<"system" | "dark" | "light">;
    setTheme?: (theme: "system" | "dark" | "light") => Promise<boolean>;
    getSystemTheme?: () => Promise<"dark" | "light">;
  };
}
