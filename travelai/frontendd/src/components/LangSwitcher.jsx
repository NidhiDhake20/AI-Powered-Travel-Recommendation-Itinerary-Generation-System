// src/components/LangSwitcher.jsx

import { useState, useRef, useEffect } from 'react'
import { useLang, LANGUAGES } from '../context/LangContext'

export default function LangSwitcher() {
  const { lang, changeLang } = useLang()
  const [open, setOpen]       = useState(false)
  const ref                   = useRef()
  const current               = LANGUAGES.find(l => l.code === lang)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl
          border border-gray-200 hover:bg-gray-50
          text-sm font-medium text-gray-700 transition-all">
        <span className="text-base">{current?.flag}</span>
        <span className="hidden sm:block">{current?.native}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44
          bg-white rounded-2xl shadow-xl border border-gray-100
          z-50 overflow-hidden">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { changeLang(l.code); setOpen(false) }}
              className={`w-full flex items-center gap-3
                px-4 py-3 text-sm hover:bg-blue-50
                transition-colors text-left
                ${lang === l.code
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-700'
                }`}>
              <span className="text-lg">{l.flag}</span>
              <div>
                <p className="font-medium leading-tight">{l.native}</p>
                <p className="text-xs text-gray-400">{l.name}</p>
              </div>
              {lang === l.code && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}