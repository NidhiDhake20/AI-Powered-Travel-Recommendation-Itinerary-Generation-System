// src/context/LangContext.jsx

import { createContext, useContext, useState } from 'react'
import translations from '../i18n/translations'

const LangContext = createContext()

export const LANGUAGES = [
  { code: 'en', name: 'English',    flag: '🇬🇧', native: 'English'  },
  { code: 'hi', name: 'Hindi',      flag: '🇮🇳', native: 'हिंदी'    },
  { code: 'mr', name: 'Marathi',    flag: '🇮🇳', native: 'मराठी'    },
  { code: 'ta', name: 'Tamil',      flag: '🇮🇳', native: 'தமிழ்'    },
  { code: 'te', name: 'Telugu',     flag: '🇮🇳', native: 'తెలుగు'   },
  { code: 'bn', name: 'Bengali',    flag: '🇮🇳', native: 'বাংলা'    },
  { code: 'gu', name: 'Gujarati',   flag: '🇮🇳', native: 'ગુજરાતી'  },
]

export function LangProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('travelai_lang') || 'en'
  )

  function changeLang(code) {
    setLang(code)
    localStorage.setItem('travelai_lang', code)
  }

  // t() function — returns translation
  // Falls back to English if key missing
  function t(key) {
    return (
      translations[lang]?.[key] ||
      translations['en']?.[key] ||
      key
    )
  }

  return (
    <LangContext.Provider value={{ lang, changeLang, t, LANGUAGES }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)