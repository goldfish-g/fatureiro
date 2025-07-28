import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { useEffect, useState } from 'react'
import { StringsContext } from './lib/strings-context'
import './index.css'
import { Toaster } from "@/components/ui/sonner"


function StringsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<'en' | 'pt'>('en')
  const [strings, setStrings] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchLang = async () => {
      const lang = await window.language.getLanguage?.()
      setLanguageState(lang || 'en')
      const loadedStrings = await window.language.getStrings?.()
      setStrings(loadedStrings || {})
    }
    fetchLang()
  }, [])

  useEffect(() => {
    const updateStrings = async () => {
      const loadedStrings = await window.language.getStrings?.()
      setStrings(loadedStrings || {})
    }
    updateStrings()
  }, [language])

  const setLanguage = async (newLang: 'en' | 'pt') => {
    setLanguageState(newLang)
    await window.language.setLanguage(newLang)
    const loadedStrings = await window.language.getStrings?.()
    setStrings(loadedStrings || {})
  }

  return (
    <StringsContext.Provider value={{ strings, language, setLanguage }}>
      {children}
    </StringsContext.Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StringsProvider>
      <App />
      <Toaster />
    </StringsProvider>
  </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
