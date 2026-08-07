import { useState, useEffect, useRef } from 'react'
import { useLang } from '../../context/LangContext'
import { sendChatMessage }              from '../../services/apiService'

const QUICK_PROMPTS = [
  'Best food to try here?', 'What to pack?',
  'Local transport tips?',  'Hidden gems nearby?',
  'Safety tips?',           'Budget saving advice?',
  'Best time to visit?',    'Family-friendly spots?',
]

export default function ChatbotTab({ destination, filters }) {
  const { lang } = useLang()
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const endRef                   = useRef(null)
  const inputRef                 = useRef(null)

  useEffect(() => {
    const dest = destination?.name || 'India'
    setMessages([{
      role: 'assistant',
      content: destination
        ? `Hey! 👋 I'm TravelBot, your AI guide for **${destination.name}**! I know everything about this destination. What would you like to know? 🌏`
        : `Hey! 👋 I'm TravelBot, your AI Indian travel assistant! Ask me anything about travel in India. 🌏`,
    }])
  }, [destination])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend(text = null) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setMessages(p => [...p, { role: 'user', content: msg }])
    setInput('')
    setLoading(true)
    try {
      const tripContext = destination ? {
        destination: destination.name,
        state:       destination.state,
        no_of_days:  filters?.no_of_days,
        budget_inr:  filters?.budget_inr,
        purpose:     filters?.purpose,
        interests:   filters?.interests,
        age_range:   filters?.age_range,
        num_adults:  filters?.num_adults,
        num_children:filters?.num_children,
      } : {}
      const res = await sendChatMessage(msg, tripContext, lang)
      setMessages(p => [...p, { role: 'assistant', content: res.response || 'Sorry, no response.' }])
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: '😔 Connection error. Make sure the chatbot service is running.' }])
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 h-[calc(100vh-130px)] flex flex-col">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 mb-6 flex items-center gap-4 text-white">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">🤖</div>
        <div>
          <h2 className="text-xl font-bold">TravelBot AI</h2>
          <p className="text-blue-100 text-sm">
            {destination ? `Expert on ${destination.name}, ${destination.state}` : 'AI Indian Travel Assistant · Powered by Gemini'}
          </p>
        </div>
        {destination && (
          <div className="ml-auto text-right">
            <p className="text-xs text-blue-200">Current Trip</p>
            <p className="font-bold">{destination.name}</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center text-lg shrink-0 mr-3 mt-1">🤖</div>
            )}
            <div className={`max-w-[75%] px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-gray-700 rounded-tl-sm border border-gray-100'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center text-lg shrink-0 mr-3">🤖</div>
            <div className="bg-white px-5 py-4 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex gap-1.5">{[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2 font-medium">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => handleSend(p)} disabled={loading}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-full transition-all font-medium disabled:opacity-50">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 focus-within:border-blue-500 transition-all shadow-sm flex items-end gap-3 px-5 py-4">
        <textarea ref={inputRef} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Ask anything about your trip..."
          disabled={loading} rows={1}
          className="flex-1 resize-none text-sm focus:outline-none text-gray-700 placeholder-gray-300"
          style={{ maxHeight: '120px' }}/>
        <button onClick={() => handleSend()} disabled={!input.trim() || loading}
          className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-2xl flex items-center justify-center transition-all shrink-0">
          <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  )
}
