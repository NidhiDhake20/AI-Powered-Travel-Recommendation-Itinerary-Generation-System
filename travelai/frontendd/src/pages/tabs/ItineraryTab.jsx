// src/pages/tabs/ItineraryTab.jsx

import { useState, useEffect, useRef } from 'react'
import { useLang }                     from '../../context/LangContext'
import { getItinerary, saveTrip }      from '../../services/apiService'
import WeatherWidget                   from '../../components/WeatherWidget'
import MapEmbed                        from '../../components/MapEmbed'
import {
  BUDGET_CATEGORIES, CATEGORY_COLORS,
  TYPE_ICONS, PURPOSES, AGE_RANGES,
  HEALTH_ISSUES, PURPOSE_ICONS, HEALTH_ICONS,
  INTERESTS, INTEREST_ICONS, CUISINE_TYPES,
  DESTINATION_DETAILS,
} from '../../config'

// ── Import destinations from config ────────
// Add this to your config.js:
// export const ALL_DESTINATIONS = [list of 40]

const ALL_DESTINATIONS = [
  "Ahmedabad","Ajanta Caves","Auli","Baga Beach",
  "Bangalore","Bir Billing","Calangute Beach","Chandigarh",
  "Coorg","Delhi","Ellora Caves","Fatehpur Sikri",
  "Gokarna Beach","Hampi Ruins","Hyderabad","Jaipur",
  "Kerala Backwaters","Khajuraho Temples","Kodaikanal",
  "Kolkata","Konark Sun Temple","Kovalam Beach","Leh Ladakh",
  "Manali","Marina Beach","Mumbai","Munnar","Ooty",
  "Radhanagar Beach","Red Fort","Rishikesh","Sandakphu",
  "Spiti Trek","Spiti Valley","Taj Mahal","Tarkarli Beach",
  "Tawang","Valley of Flowers","Varkala Beach","Zanskar Valley",
]

const ACTIVITY_ICONS = {
  Sightseeing:'🏛️', Food:'🍽️', Adventure:'🧗',
  Leisure:'🌴', Shopping:'🛍️', Nature:'🌿',
  Exploration:'🔍', Beach:'🏖️', Trek:'🥾',
}

// ── Agent status indicator ─────────────────
function AgentStatus({ done }) {
  const agents = [
    { name:'Day Planner', icon:'📅' },
    { name:'Weather',     icon:'🌤️' },
    { name:'Budget',      icon:'💰' },
    { name:'Food & Tips', icon:'🍛' },
    { name:'Transport',   icon:'🚗' },
    { name:'Coordinator', icon:'🎯' },
  ]
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {agents.map((a, i) => (
        <div key={a.name}
          className={`flex items-center gap-2 p-3 rounded-2xl border text-sm transition-all ${
            done > i
              ? 'bg-green-50 border-green-200'
              : done === i
              ? 'bg-blue-50 border-blue-300 animate-pulse'
              : 'bg-gray-50 border-gray-200 opacity-50'
          }`}>
          <span className="text-xl">{a.icon}</span>
          <div>
            <p className="text-xs font-bold text-gray-700">{a.name}</p>
            <p className="text-xs text-gray-400">
              {done > i ? '✅ Done' : done === i ? 'Running...' : 'Waiting'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Default filters ────────────────────────
const DEFAULT_FILTERS = {
  age_range:    '26-35',
  budget_inr:   50000,
  num_adults:   2,
  num_children: 0,
  no_of_days:   3,
  interests:    ['Photography', 'Nature & Relaxation'],
  purpose:      'Leisure',
  health_issue: 'None',
  cuisine_type: '',
}

export default function ItineraryTab({
  initialDestination,
  initialFilters,
  onClearDest,
}) {
  const { lang } = useLang()

  // ── Mode ────────────────────────────────
  // 'select'      → choosing mode
  // 'independent' → manual search form
  // 'linked'      → came from recommendation
  // 'loading'     → generating itinerary
  // 'view'        → viewing itinerary
  const [mode, setMode] = useState('select')

  // ── Destination + filters state ─────────
  const [destination,    setDestination]   = useState(null)
  const [filters,        setFilters]       = useState(DEFAULT_FILTERS)

  // ── Independent search state ─────────────
  const [searchQuery,    setSearchQuery]   = useState('')
  const [searchResults,  setSearchResults] = useState([])
  const [selectedDest,   setSelectedDest]  = useState('')
  const [indFilters,     setIndFilters]    = useState(DEFAULT_FILTERS)
  const [showFilters,    setShowFilters]   = useState(false)

  // ── Itinerary data state ─────────────────
  const [itinerary,  setItinerary]  = useState(null)
  const [tripId,     setTripId]     = useState(null)
  const [weather,    setWeather]    = useState([])
  const [agentsDone, setAgentsDone] = useState(0)
  const [error,      setError]      = useState('')

  // ── Itinerary view state ─────────────────
  const [tab,       setTab]    = useState('plan')
  const [dayIdx,    setDayIdx] = useState(0)
  const [saved,     setSaved]  = useState(false)
  const [saving,    setSaving] = useState(false)
  const [expenses,  setExpenses]= useState([])
  const [expForm,   setExpForm] = useState({
    category: 'Food', description: '', amount: ''
  })

  // ── Handle incoming linked destination ───
  useEffect(() => {
    if (initialDestination && initialFilters) {
      setDestination(initialDestination)
      setFilters(initialFilters)
      setMode('linked')
      generateItinerary(initialDestination, initialFilters)
    }
  }, [initialDestination, initialFilters])

  // ── Search destinations (filter list) ───
  function handleSearch(query) {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    const q = query.toLowerCase()
    setSearchResults(
      ALL_DESTINATIONS.filter(d => d.toLowerCase().includes(q)).slice(0, 8)
    )
  }

  function selectDestination(name) {
    setSelectedDest(name)
    setSearchQuery(name)
    setSearchResults([])
  }

  // ── Generate itinerary ───────────────────
  async function generateItinerary(dest, f) {
    setMode('loading')
    setError('')
    setItinerary(null)
    setDayIdx(0)
    setSaved(false)
    setExpenses([])
    setAgentsDone(0)

    // Simulate agent progress (every 12 seconds)
    const interval = setInterval(() => {
      setAgentsDone(prev => {
        if (prev >= 5) { clearInterval(interval); return prev }
        return prev + 1
      })
    }, 12000)

    try {
      const res = await getItinerary(dest, f, lang)
      clearInterval(interval)
      setAgentsDone(6)
      if (res.itinerary) {
        setItinerary(res.itinerary)
        setWeather(res.weather || [])
        setTripId(res.trip_id)
        setDestination(dest)
        setFilters(f)
        setMode('view')
      } else {
        throw new Error('No itinerary in response')
      }
    } catch (e) {
      clearInterval(interval)
      setError('Failed to generate itinerary. Make sure itinerary service is running.')
      setMode(destination ? 'independent' : 'select')
    }
  }

  // ── Start independent search ─────────────
  function handleIndependentSubmit(e) {
    e.preventDefault()
    if (!selectedDest) { setError('Please select a destination'); return }
    setError('')
    const dest = {
      name:        selectedDest,
      state:       DESTINATION_DETAILS?.[selectedDest]?.state || '',
      type:        DESTINATION_DETAILS?.[selectedDest]?.type  || 'Nature',
      image_url:   DESTINATION_DETAILS?.[selectedDest]?.image_url || '',
      trip_id:     null,
      ml_score:    0,
      api_score:   0,
      final_score: 0,
    }
    generateItinerary(dest, indFilters)
  }

  // ── Save trip ───────────────────────────
  async function handleSave() {
    if (!tripId || saved) return
    setSaving(true)
    try { await saveTrip({ trip_id: tripId }); setSaved(true) }
    catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  // ── Add expense ─────────────────────────
  function handleAddExpense(e) {
    e.preventDefault()
    if (!expForm.description || !expForm.amount) return
    setExpenses(p => [{
      id:          Date.now(),
      category:    expForm.category,
      description: expForm.description,
      amount:      parseFloat(expForm.amount),
    }, ...p])
    setExpForm({ category: 'Food', description: '', amount: '' })
  }

  // ── Budget calcs ────────────────────────
  const totalBudget = filters?.budget_inr || 0
  const totalSpent  = expenses.reduce((s, e) => s + e.amount, 0)
  const remaining   = totalBudget - totalSpent
  const spentPct    = totalBudget > 0
    ? Math.min((totalSpent / totalBudget) * 100, 100)
    : 0
  const byCategory  = BUDGET_CATEGORIES.reduce((a, c) => {
    a[c] = expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0)
    return a
  }, {})

  const days       = itinerary?.days || []
  const currentDay = days[dayIdx] || null

  // ══════════════════════════════════════════
  // MODE: SELECT
  // ══════════════════════════════════════════
  if (mode === 'select') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">

        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Plan Your Itinerary
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Generate a complete AI-powered day-by-day travel plan.
            Use our recommendations or search any destination directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Option 1 — From Recommendation */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-8 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              From Recommendations
            </h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Go to the <strong>Recommend tab</strong>, get AI-powered
              destination suggestions, then click
              <strong> Plan Trip</strong> to auto-fill everything here.
            </p>
            <div className="bg-white rounded-2xl p-4 text-left space-y-2">
              {['ML model finds best destinations','Google Places validates','Filters auto-transferred','Itinerary generated instantly'].map(s => (
                <div key={s} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-blue-500 font-bold">→</span> {s}
                </div>
              ))}
            </div>
          </div>

          {/* Option 2 — Independent */}
          <div
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-8 text-center cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
            onClick={() => setMode('independent')}
          >
            <div className="text-5xl mb-4">✏️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Search Directly
            </h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Choose any of the <strong>40 Indian destinations</strong>
              and enter your preferences to generate a
              <strong> custom itinerary</strong> independently.
            </p>
            <div className="bg-white rounded-2xl p-4 text-left space-y-2">
              {['Pick from 40 destinations','Set your own preferences','6 Gemini agents plan','Real venues + weather'].map(s => (
                <div key={s} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500 font-bold">→</span> {s}
                </div>
              ))}
            </div>
            <div className="mt-4 bg-green-600 text-white px-6 py-3 rounded-2xl font-bold text-sm inline-block">
              Start Planning →
            </div>
          </div>

        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════
  // MODE: INDEPENDENT SEARCH FORM
  // ══════════════════════════════════════════
  if (mode === 'independent') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => { setMode('select'); setError('') }}
            className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
            ←
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Plan Itinerary Directly
            </h2>
            <p className="text-gray-400 text-sm">
              Choose destination + set preferences
            </p>
          </div>
        </div>

        <form onSubmit={handleIndependentSubmit} className="space-y-6">

          {/* Destination Search */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <label className="text-sm font-bold text-gray-700 block mb-3">
              🗺️ Select Destination
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search from 40 Indian destinations..."
                className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 text-sm"
              />
              {/* Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                  {searchResults.map(dest => {
                    const info = DESTINATION_DETAILS?.[dest] || {}
                    return (
                      <button
                        key={dest}
                        type="button"
                        onClick={() => selectDestination(dest)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0">
                        <span className="text-xl">{TYPE_ICONS[info.type] || '📍'}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{dest}</p>
                          <p className="text-xs text-gray-400">
                            {info.state} · {info.type} · Best: {info.best_time}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Show all destinations as grid if no search */}
            {!searchQuery && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-3">
                  Or pick from all 40 destinations:
                </p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {ALL_DESTINATIONS.map(dest => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => selectDestination(dest)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedDest === dest
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                      }`}>
                      {dest}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected destination preview */}
            {selectedDest && DESTINATION_DETAILS?.[selectedDest] && (
              <div className="mt-4 bg-blue-50 rounded-2xl p-4 flex items-center gap-4">
                <img
                  src={DESTINATION_DETAILS[selectedDest].image_url}
                  alt={selectedDest}
                  className="w-16 h-16 rounded-xl object-cover"
                  onError={e => { e.target.src = `https://source.unsplash.com/200x200/?${selectedDest.toLowerCase()},india` }}
                />
                <div>
                  <p className="font-bold text-gray-800">
                    {TYPE_ICONS[DESTINATION_DETAILS[selectedDest].type]} {selectedDest}
                  </p>
                  <p className="text-sm text-gray-500">
                    📍 {DESTINATION_DETAILS[selectedDest].state} ·
                    🗓️ Best: {DESTINATION_DETAILS[selectedDest].best_time} ·
                    🍛 {DESTINATION_DETAILS[selectedDest].cuisine}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedDest(''); setSearchQuery('') }}
                  className="ml-auto text-gray-400 hover:text-gray-600 text-lg">
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors">
              <div>
                <h3 className="text-sm font-bold text-gray-700">
                  ⚙️ Trip Preferences
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {indFilters.no_of_days} days · ₹{indFilters.budget_inr.toLocaleString()} · {indFilters.age_range} · {indFilters.purpose}
                </p>
              </div>
              <span className="text-gray-400 text-xl">
                {showFilters ? '▲' : '▼'}
              </span>
            </button>

            {showFilters && (
              <div className="px-6 pb-6 space-y-5 border-t border-gray-100">

                {/* Days + Budget */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-700">Duration</label>
                      <span className="text-xs font-bold text-blue-600">{indFilters.no_of_days} Days</span>
                    </div>
                    <input type="range" min="1" max="7" step="1"
                      value={indFilters.no_of_days}
                      onChange={e => setIndFilters(p => ({ ...p, no_of_days: parseInt(e.target.value) }))}
                      className="w-full accent-blue-600"/>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-700">Budget</label>
                      <span className="text-xs font-bold text-blue-600">₹{indFilters.budget_inr.toLocaleString()}</span>
                    </div>
                    <input type="range" min="11000" max="130000" step="1000"
                      value={indFilters.budget_inr}
                      onChange={e => setIndFilters(p => ({ ...p, budget_inr: parseInt(e.target.value) }))}
                      className="w-full accent-blue-600"/>
                  </div>
                </div>

                {/* Age + Purpose */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">Age Range</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {AGE_RANGES.map(a => (
                        <button key={a} type="button"
                          onClick={() => setIndFilters(p => ({ ...p, age_range: a }))}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all ${indFilters.age_range === a ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">Purpose</label>
                    <div className="space-y-1.5">
                      {PURPOSES.map(p => (
                        <button key={p} type="button"
                          onClick={() => setIndFilters(prev => ({ ...prev, purpose: p }))}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${indFilters.purpose === p ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                          {PURPOSE_ICONS[p]} {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Travelers */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Travelers</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ label: 'Adults', key: 'num_adults', min: 1, max: 2 }, { label: 'Children', key: 'num_children', min: 0, max: 2 }].map(({ label, key, min, max }) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
                        <span className="text-xs text-gray-600 font-medium">{label}</span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setIndFilters(p => ({ ...p, [key]: Math.max(min, p[key] - 1) }))}
                            className="w-7 h-7 rounded-full bg-white shadow text-sm font-bold text-gray-600 hover:bg-gray-100">−</button>
                          <span className="text-sm font-bold w-4 text-center">{indFilters[key]}</span>
                          <button type="button" onClick={() => setIndFilters(p => ({ ...p, [key]: Math.min(max, p[key] + 1) }))}
                            className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Health */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Health</label>
                  <div className="grid grid-cols-2 gap-2">
                    {HEALTH_ISSUES.map(h => (
                      <button key={h} type="button"
                        onClick={() => setIndFilters(p => ({ ...p, health_issue: h }))}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs transition-all ${indFilters.health_issue === h ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                        {HEALTH_ICONS[h]} {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-700">Interests</label>
                    <span className="text-xs text-blue-600">{indFilters.interests.length} selected</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {INTERESTS.map(i => (
                      <button key={i} type="button"
                        onClick={() => setIndFilters(p => ({
                          ...p,
                          interests: p.interests.includes(i)
                            ? p.interests.filter(x => x !== i)
                            : [...p.interests, i]
                        }))}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs transition-all ${indFilters.interests.includes(i) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                        {INTEREST_ICONS[i]} <span className="truncate">{i}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cuisine */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Cuisine Preference <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <select
                    value={indFilters.cuisine_type}
                    onChange={e => setIndFilters(p => ({ ...p, cuisine_type: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-xs focus:outline-none focus:border-blue-500">
                    <option value="">No preference</option>
                    {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-5 py-4 rounded-2xl">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedDest}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-5 rounded-3xl font-bold text-base transition-all shadow-lg shadow-blue-100">
            {selectedDest
              ? `🤖 Generate Itinerary for ${selectedDest} →`
              : 'Select a destination first'
            }
          </button>

        </form>
      </div>
    )
  }

  // ══════════════════════════════════════════
  // MODE: LOADING
  // ══════════════════════════════════════════
  if (mode === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-pulse">🤖</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            6 AI Agents Planning Your Trip
          </h2>
          <p className="text-gray-400">
            Building itinerary for <strong>{destination?.name || selectedDest}</strong>
          </p>
        </div>

        <AgentStatus done={agentsDone} />

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
              style={{ width: `${(agentsDone / 6) * 100}%` }}/>
          </div>
          <p className="text-sm text-gray-400">
            {agentsDone < 6
              ? `Agent ${agentsDone + 1} of 6 running... Please wait 60-90 seconds`
              : 'Finalizing your itinerary...'
            }
          </p>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 text-sm px-5 py-4 rounded-2xl">
            ⚠️ {error}
            <button
              onClick={() => setMode('select')}
              className="ml-3 underline font-semibold">
              Go back
            </button>
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════
  // MODE: VIEW ITINERARY
  // ══════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">

      {/* ── Hero Header ─────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* Mode badge */}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                mode === 'linked'
                  ? 'bg-white/30 text-white'
                  : 'bg-white/20 text-white'
              }`}>
                {mode === 'linked' ? '🔗 From Recommendations' : '✏️ Independent Search'}
              </span>
            </div>
            <h2 className="text-3xl font-bold">{destination?.name}</h2>
            <div className="flex flex-wrap gap-3 text-blue-100 text-sm mt-1">
              {destination?.state && <span>📍 {destination.state}</span>}
              {filters?.no_of_days && <span>🗓️ {filters.no_of_days} Days</span>}
              {filters?.num_adults && <span>👥 {filters.num_adults} Adults{filters.num_children > 0 ? ` + ${filters.num_children} Kids` : ''}</span>}
              {filters?.budget_inr && <span>💰 ₹{filters.budget_inr?.toLocaleString()}</span>}
              {filters?.purpose && <span>{PURPOSE_ICONS[filters.purpose]} {filters.purpose}</span>}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Change destination */}
            <button
              onClick={() => {
                setMode('select')
                setItinerary(null)
                setDestination(null)
                setSelectedDest('')
                setSearchQuery('')
                onClearDest?.()
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
              ↩ Change
            </button>

            {/* Regenerate */}
            <button
              onClick={() => generateItinerary(destination, filters)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
              ↺ Regenerate
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saved || saving}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}>
              {saved ? '✓ Saved' : saving ? 'Saving...' : '🔖 Save Trip'}
            </button>

            {/* PDF */}
            <button
              onClick={() => window.print()}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
              📄 PDF
            </button>
          </div>
        </div>

        {/* Interest tags */}
        {filters?.interests?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.interests.map(i => (
              <span key={i} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                {INTEREST_ICONS[i]} {i}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Inner Tabs ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="flex overflow-x-auto">
          {[['plan','📅 Day Plan'],['map','🗺️ Map'],['budget','💰 Budget'],['info','ℹ️ Info']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-6 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ TAB: DAY PLAN ══════════════════════ */}
      {tab === 'plan' && (
        <div>
          {/* Day selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {days.map((d, i) => (
              <button key={i} onClick={() => setDayIdx(i)}
                className={`shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${dayIdx === i ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                Day {d.day}
              </button>
            ))}
          </div>

          {currentDay && (
            <div>
              {/* Day header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Day {currentDay.day} — {currentDay.title}
                  </h3>
                  {currentDay.theme && (
                    <p className="text-gray-400 text-sm mt-1">{currentDay.theme}</p>
                  )}
                </div>
                <div className="text-right">
                  {currentDay.daily_budget && (
                    <p className="text-lg font-bold text-green-600">
                      ₹{currentDay.daily_budget?.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">Est. day cost</p>
                </div>
              </div>

              {/* Weather */}
              {currentDay.weather && (
                <div className="mb-5">
                  <WeatherWidget weather={currentDay.weather} />
                </div>
              )}
              {currentDay.weather?.packing_tip && (
                <div className="mb-5 bg-amber-50 border border-amber-100 px-5 py-3 rounded-2xl text-sm text-amber-700">
                  💡 {currentDay.weather.packing_tip}
                </div>
              )}

              {/* Activities */}
              <div className="space-y-4">
                {currentDay.activities?.map((act, i) => (
                  <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <div className="flex items-start gap-5">
                      <div className="shrink-0 text-center">
                        <div className="bg-blue-600 text-white rounded-2xl px-3 py-2 text-xs font-bold mb-2">
                          {act.time}
                        </div>
                        <div className="text-3xl">{ACTIVITY_ICONS[act.type] || '📍'}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-2 ${
                              act.slot === 'Morning'   ? 'bg-yellow-100 text-yellow-700' :
                              act.slot === 'Lunch'     ? 'bg-orange-100 text-orange-700' :
                              act.slot === 'Afternoon' ? 'bg-blue-100 text-blue-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {act.slot}
                            </span>
                            <h4 className="text-lg font-bold text-gray-900">{act.name}</h4>
                          </div>
                          {act.cost_per_person > 0 && (
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold text-green-600">
                                ₹{act.cost_per_person?.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400">per person</p>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm mt-1 mb-3">{act.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          {act.location && <span>📍 {act.location}</span>}
                          {act.duration && <span>⏱️ {act.duration}</span>}
                        </div>
                        {act.tips && (
                          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-2.5">
                            <p className="text-xs text-amber-700">💡 {act.tips}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Day footer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {currentDay.transport && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 text-sm text-blue-700">
                    🚗 {currentDay.transport}
                  </div>
                )}
                {currentDay.daily_tip && (
                  <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 text-sm text-green-700">
                    ✨ {currentDay.daily_tip}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: MAP ═══════════════════════════ */}
      {tab === 'map' && (
        <div>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {days.map((d, i) => (
              <button key={i} onClick={() => setDayIdx(i)}
                className={`shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${dayIdx === i ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                Day {d.day}
              </button>
            ))}
          </div>
          <MapEmbed destination={destination?.name} activities={currentDay?.activities || []} />
          {currentDay && (
            <div className="mt-5 space-y-2">
              <h3 className="font-bold text-gray-800 mb-3">Day {currentDay.day} Locations</h3>
              {currentDay.activities?.map((act, i) => (
                <div key={i} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <span className="text-2xl">{ACTIVITY_ICONS[act.type] || '📍'}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{act.name}</p>
                    <p className="text-xs text-gray-400">📍 {act.location} · {act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: BUDGET ════════════════════════ */}
      {tab === 'budget' && (
        <div className="max-w-2xl">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              ['Total',   `₹${totalBudget.toLocaleString()}`,  'blue'],
              ['Spent',   `₹${totalSpent.toLocaleString()}`,   'red'],
              ['Left',    `₹${Math.abs(remaining).toLocaleString()}${remaining < 0 ? ' over' : ''}`, remaining < 0 ? 'red' : 'green'],
            ].map(([l, v, c]) => (
              <div key={l} className={`bg-${c}-50 rounded-3xl p-5 text-center`}>
                <p className="text-xs text-gray-500 mb-1">{l}</p>
                <p className={`text-xl font-black text-${c}-600`}>{v}</p>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-5">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-medium text-gray-600">Budget Used</span>
              <span className={`font-bold ${spentPct > 100 ? 'text-red-500' : spentPct > 80 ? 'text-yellow-500' : 'text-green-600'}`}>
                {spentPct.toFixed(1)}%
              </span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${spentPct > 100 ? 'bg-red-500' : spentPct > 80 ? 'bg-yellow-500' : 'bg-gradient-to-r from-blue-500 to-green-500'}`}
                style={{ width: `${Math.min(spentPct, 100)}%` }}/>
            </div>
            {remaining < 0 && (
              <p className="text-red-500 text-xs mt-2">
                ⚠️ Over budget by ₹{Math.abs(remaining).toLocaleString()}
              </p>
            )}
          </div>

          {/* Category breakdown */}
          {Object.values(byCategory).some(v => v > 0) && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-5">
              <h3 className="font-bold text-gray-800 mb-4">By Category</h3>
              {BUDGET_CATEGORIES.map(cat => {
                const amt = byCategory[cat] || 0
                const pct = totalSpent > 0 ? (amt / totalSpent) * 100 : 0
                if (!amt) return null
                return (
                  <div key={cat} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium">{cat}</span>
                      <span className="font-bold">₹{amt.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat] }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add expense */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-5">
            <h3 className="font-bold text-gray-800 mb-4">Add Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <select value={expForm.category}
                onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500">
                {BUDGET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="text" placeholder="Description" value={expForm.description}
                onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} required
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500"/>
              <div className="flex gap-3">
                <input type="number" placeholder="Amount ₹" value={expForm.amount}
                  onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} required min="0"
                  className="flex-1 px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500"/>
                <button type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm">
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* Expense list */}
          {expenses.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Expenses ({expenses.length})</h3>
              <div className="space-y-2">
                {expenses.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[exp.category] }}/>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{exp.description}</p>
                        <p className="text-xs text-gray-400">{exp.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800">₹{exp.amount.toLocaleString()}</span>
                      <button
                        onClick={() => setExpenses(p => p.filter(e => e.id !== exp.id))}
                        className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full text-xs">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: INFO ══════════════════════════ */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">

          {/* Trip summary */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">📋 Trip Summary</h3>
            {[
              ['Destination', destination?.name],
              ['State',       destination?.state],
              ['Type',        destination?.type],
              ['Duration',    `${filters?.no_of_days} Days`],
              ['Travelers',   `${filters?.num_adults} Adults${filters?.num_children > 0 ? ` + ${filters.num_children} Kids` : ''}`],
              ['Budget',      `₹${filters?.budget_inr?.toLocaleString()}`],
              ['Purpose',     filters?.purpose],
              ['Mode',        mode === 'linked' ? '🔗 From Recommendations' : '✏️ Independent'],
            ].filter(([, v]) => v).map(([l, v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className="text-sm font-semibold text-gray-800">{v}</span>
              </div>
            ))}
          </div>

          {/* Hotels */}
          {itinerary?.hotels?.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">🏨 Hotel Options</h3>
              {itinerary.hotels.map((h, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{h.name}</p>
                    <p className="text-xs text-gray-400">⭐ {h.rating}</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">{h.price_per_night}/night</span>
                </div>
              ))}
            </div>
          )}

          {/* Packing list */}
          {itinerary?.packing_list?.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">🎒 Packing List</h3>
              <div className="grid grid-cols-2 gap-2">
                {itinerary.packing_list.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>{item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saving tips */}
          {itinerary?.saving_tips?.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">💡 Saving Tips</h3>
              <ul className="space-y-2">
                {itinerary.saving_tips.map((t, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 shrink-0">✓</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weather all days */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 md:col-span-2">
            <h3 className="font-bold text-gray-800 mb-4">🌤️ Weather Forecast</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {days.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 w-14 shrink-0">
                    Day {d.day}
                  </span>
                  <WeatherWidget weather={d.weather} />
                </div>
              ))}
            </div>
          </div>

          {/* Emergency */}
          <div className="bg-red-50 rounded-3xl p-6 md:col-span-2">
            <h3 className="font-bold text-red-700 mb-4">🆘 Emergency Contacts</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[['Police','100'],['Ambulance','108'],['Fire','101'],['Tourist','1800-11-1363'],['Women','1091']].map(([l, n]) => (
                <div key={l} className="text-center bg-white rounded-2xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{l}</p>
                  <a href={`tel:${n}`} className="text-sm font-black text-red-600">{n}</a>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}