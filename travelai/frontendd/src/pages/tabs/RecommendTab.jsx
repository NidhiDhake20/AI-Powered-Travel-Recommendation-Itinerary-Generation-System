// src/pages/tabs/RecommendTab.jsx

import { useState } from 'react'
import { useLang } from '../../context/LangContext'
import { getRecommendations } from '../../services/apiService'
import {
  INTERESTS, PURPOSES, AGE_RANGES,
  HEALTH_ISSUES, CUISINE_TYPES,
  INTEREST_ICONS, PURPOSE_ICONS,
  HEALTH_ICONS, TYPE_ICONS,
} from '../../config'

// ── Score Bar ──────────────────────────────
function ScoreBar({ label, score, color }) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-bold">{score?.toFixed(0) || 0}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(score || 0, 100)}%` }}
        />
      </div>
    </div>
  )
}

// ── Budget Split Section ───────────────────
function BudgetSplit({ budget_split }) {
  if (!budget_split) return null

  const cats = [
    'accommodation',
    'food',
    'activities',
    'transport',
    'miscellaneous',
  ]

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-700">
            💰 Budget Split
          </p>
          <p className="text-xs text-gray-400">
            {budget_split.algorithm}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Per Day</p>
          <p className="text-sm font-bold text-blue-600">
            ₹{budget_split.per_day?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex h-5 rounded-full overflow-hidden mb-3">
        {cats.map(key => {
          const cat = budget_split.categories?.[key]
          if (!cat) return null
          return (
            <div
              key={key}
              className={`${cat.color} flex items-center
                justify-center transition-all`}
              style={{ width: `${cat.percentage}%` }}
              title={`${cat.label}: ${cat.percentage}%`}>
              {cat.percentage > 10 && (
                <span className="text-white text-xs font-bold">
                  {cat.percentage}%
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Category rows */}
      <div className="space-y-2">
        {cats.map(key => {
          const cat = budget_split.categories?.[key]
          if (!cat) return null
          return (
            <div key={key}
              className="flex items-center justify-between
                bg-gray-50 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full
                  ${cat.color}`}/>
                <span className="text-xs text-gray-700 font-medium">
                  {cat.label}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-800">
                  ₹{cat.per_day?.toLocaleString()}/day
                </p>
                <p className="text-xs text-gray-400">
                  {cat.percentage}% · ₹{cat.total?.toLocaleString()} total
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total row */}
      <div className="mt-3 bg-blue-50 rounded-xl p-3
        flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-blue-700">
            Total Trip Budget
          </p>
          <p className="text-xs text-blue-500">
            {budget_split.no_of_days} days ·
            {budget_split.destination_type}
          </p>
        </div>
        <p className="text-lg font-black text-blue-700">
          ₹{budget_split.total_budget?.toLocaleString()}
        </p>
      </div>

      {/* Algorithm steps */}
      <div className="mt-3 bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-bold text-gray-500 mb-2">
          Algorithm Trace
        </p>
        {budget_split.algorithm_steps?.map((step, i) => (
          <p key={i} className="text-xs text-gray-500 mb-1">
            {step}
          </p>
        ))}
      </div>

    </div>
  )
}

// ── Basic Plan Preview ─────────────────────
function BasicPlanPreview({ basic_plan, no_of_days }) {
  if (!basic_plan || basic_plan.length === 0) return null

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <p className="text-sm font-bold text-gray-700 mb-3">
        📅 Trip Plan Preview
      </p>
      <div className="space-y-2">
        {basic_plan.slice(0, no_of_days).map((day, i) => (
          <div
            key={i}
            className="flex items-start gap-3 bg-gray-50 rounded-xl p-2.5"
          >
            <div className="shrink-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
              Day {day.day}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {day.activity}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main RecommendTab ──────────────────────
export default function RecommendTab({ onPlanTrip }) {
  const { lang } = useLang()
  const [filters, setFilters] = useState({
    age_range:    '26-35',
    budget_inr:   50000,
    num_adults:   2,
    num_children: 0,
    no_of_days:   5,
    interests:    [],
    purpose:      'Leisure',
    health_issue: 'None',
    cuisine_type: '',
  })
  const [results,    setResults]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [searched,   setSearched]   = useState(false)
  const [expandedCard, setExpandedCard] = useState(null)

  const upd = (k, v) => setFilters(p => ({ ...p, [k]: v }))

  const toggleInterest = i =>
    setFilters(p => ({
      ...p,
      interests: p.interests.includes(i)
        ? p.interests.filter(x => x !== i)
        : [...p.interests, i],
    }))

  async function handleSearch() {
    if (!filters.interests.length) {
      setError('Select at least one interest')
      return
    }
    setError('')
    setLoading(true)
    setExpandedCard(null)
    try {
      const res = await getRecommendations({ ...filters, language: lang })
      setResults(res.recommendations || [])
      setSearched(true)
      if (res.health_note) setError(res.health_note)
    } catch {
      setError('Failed. Make sure all services are running.')
    } finally {
      setLoading(false) }
  }

  const budgetLabel = b =>
    b <= 35000 ? 'Budget' :
    b <= 65000 ? 'Mid Range' :
    b <= 100000 ? 'Premium' : 'Luxury'

  const budgetColor = b =>
    b <= 35000 ? 'text-green-600' :
    b <= 65000 ? 'text-blue-600' :
    b <= 100000 ? 'text-purple-600' : 'text-yellow-600'

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── FILTER PANEL ──────────────────── */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              🎯 Your Preferences
            </h2>

            {/* Age Range */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-gray-700 block mb-3">
                Age Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AGE_RANGES.map(a => (
                  <button key={a} onClick={() => upd('age_range', a)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${filters.age_range === a ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Budget</label>
                <div className="text-right">
                  <span className="text-sm font-bold text-blue-600">
                    ₹{filters.budget_inr.toLocaleString()}
                  </span>
                  <span className={`block text-xs ${budgetColor(filters.budget_inr)}`}>
                    {budgetLabel(filters.budget_inr)}
                  </span>
                </div>
              </div>
              <input type="range" min="11000" max="130000" step="1000"
                value={filters.budget_inr}
                onChange={e => upd('budget_inr', parseInt(e.target.value))}
                className="w-full accent-blue-600" />
            </div>

            {/* Duration */}
            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Duration</label>
                <span className="text-sm font-bold text-blue-600">
                  {filters.no_of_days} Days
                </span>
              </div>
              <input type="range" min="1" max="7" step="1"
                value={filters.no_of_days}
                onChange={e => upd('no_of_days', parseInt(e.target.value))}
                className="w-full accent-blue-600" />
            </div>

            {/* Travelers */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-gray-700 block mb-3">
                Travelers
              </label>
              {[
                { label: 'Adults',   key: 'num_adults',   min: 1, max: 2 },
                { label: 'Children', key: 'num_children', min: 0, max: 2 },
              ].map(({ label, key, min, max }) => (
                <div key={key} className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{label}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => upd(key, Math.max(min, filters[key] - 1))}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-bold">−</button>
                    <span className="text-sm font-bold w-4 text-center">{filters[key]}</span>
                    <button onClick={() => upd(key, Math.min(max, filters[key] + 1))}
                      className="w-7 h-7 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Health */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-gray-700 block mb-3">Health</label>
              <div className="grid grid-cols-2 gap-2">
                {HEALTH_ISSUES.map(h => (
                  <button key={h} onClick={() => upd('health_issue', h)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border-2 text-left transition-all text-xs ${filters.health_issue === h ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                    <span>{HEALTH_ICONS[h]}</span> {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-gray-700 block mb-3">Purpose</label>
              <div className="grid grid-cols-1 gap-2">
                {PURPOSES.map(p => (
                  <button key={p} onClick={() => upd('purpose', p)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left transition-all text-sm ${filters.purpose === p ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                    <span>{PURPOSE_ICONS[p]}</span> {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="mb-5">
              <div className="flex justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">Interests</label>
                <span className="text-xs text-blue-600 font-medium">
                  {filters.interests.length} selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {INTERESTS.map(i => (
                  <button key={i} onClick={() => toggleInterest(i)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border-2 text-left transition-all text-xs ${filters.interests.includes(i) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                    <span>{INTEREST_ICONS[i]}</span>
                    <span className="truncate">{i}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisine */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Cuisine
                <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
              </label>
              <select value={filters.cuisine_type}
                onChange={e => upd('cuisine_type', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-gray-700">
                <option value="">No preference</option>
                {CUISINE_TYPES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className={`text-xs px-4 py-3 rounded-xl mb-4 ${error.includes('⚠️') ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>
                {error}
              </div>
            )}

            <button onClick={handleSearch} disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-100">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  AI Searching...
                </span>
              ) : '🔍 Get Recommendations'}
            </button>
          </div>
        </div>

        {/* ── RESULTS PANEL ─────────────────── */}
        <div className="flex-1">

          {/* Empty state */}
          {!searched && !loading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center py-24">
                <div className="text-7xl mb-6">🗺️</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Find Your Perfect Destination
                </h3>
                <p className="text-gray-400 max-w-sm mx-auto">
                  Set your preferences and get AI-powered recommendations
                  with full budget split and trip plan preview.
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="text-5xl mb-6 animate-pulse">🤖</div>
                <p className="text-xl font-bold text-gray-700 mb-2">
                  AI + ML Searching...
                </p>
                <p className="text-gray-400 text-sm">
                  Calculating budget splits and trip plans
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {searched && !loading && results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Top Recommendations
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {results.length} destinations with budget plans
                  </p>
                </div>
                <button onClick={handleSearch}
                  className="text-sm text-blue-600 hover:underline font-medium">
                  ↺ Refresh
                </button>
              </div>

              <div className="space-y-6">
                {results.map((rec, idx) => (
                  <div key={idx}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all">

                    {/* Image + basic info */}
                    <div className="flex flex-col md:flex-row">
                      <div className="relative md:w-56 h-44 md:h-auto shrink-0">
                        <img
                          src={rec.image_url}
                          alt={rec.name}
                          className="w-full h-full object-cover"
                          onError={e => {
                            e.target.src = `https://source.unsplash.com/600x400/?${rec.name.split(' ')[0].toLowerCase()},india`
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
                        <div className="absolute top-3 left-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shadow-lg ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-700' : 'bg-orange-300 text-orange-900'}`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                          </div>
                        </div>
                        <div className="absolute bottom-3 right-3 bg-blue-600 text-white px-2.5 py-1 rounded-xl">
                          <span className="text-base font-black">{rec.final_score?.toFixed(0)}</span>
                          <span className="text-xs opacity-75">/100</span>
                        </div>
                      </div>

                      <div className="flex-1 p-5">
                        {/* Name + meta */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {TYPE_ICONS[rec.type]} {rec.name}
                            </h3>
                            <p className="text-gray-400 text-sm mt-0.5">
                              📍 {rec.state} · 🗓️ Best: {rec.best_time} · 🍛 {rec.cuisine_type}
                            </p>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${rec.source === 'both' ? 'bg-purple-100 text-purple-700' : rec.source === 'ml_only' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {rec.source === 'both' ? '🤖 AI+ML' : rec.source === 'ml_only' ? '📊 ML' : '🤖 AI'}
                          </span>
                        </div>

                        {/* Score bars */}
                        <div className="grid grid-cols-2 gap-x-4 mb-3">
                          <ScoreBar label="ML Score"        score={rec.ml_score}      color="bg-emerald-500"/>
                          <ScoreBar label="Interest Match"  score={rec.api_score}     color="bg-blue-500"/>
                          <ScoreBar label="Purpose Match"   score={rec.purpose_score} color="bg-violet-500"/>
                          <ScoreBar label="Age Suitability" score={rec.age_score}     color="bg-orange-400"/>
                        </div>

                        {/* Reasons */}
                        {rec.reasons?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {rec.reasons.map((r, i) => (
                              <span key={i} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                                ✓ {r}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Expand / Collapse button */}
                        <button
                          onClick={() => setExpandedCard(expandedCard === idx ? null : idx)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mb-3">
                          {expandedCard === idx ? '▲ Hide Details' : '▼ Show Budget Split + Trip Plan'}
                        </button>

                        {/* Expanded section */}
                        {expandedCard === idx && (
                          <div className="border-t border-gray-100 pt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Budget Split */}
                              <BudgetSplit budget_split={rec.budget_split} />

                              {/* Basic Plan */}
                              <BasicPlanPreview
                                basic_plan={rec.basic_plan}
                                no_of_days={filters.no_of_days}
                              />
                            </div>
                          </div>
                        )}

                        {/* Plan Trip Button */}
                        <button
                          onClick={() => onPlanTrip(rec, filters)}
                          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-md">
                          Plan Full Itinerary for {rec.name} →
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {searched && !loading && results.length === 0 && (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">😕</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No results found</h3>
              <p className="text-gray-400 text-sm">Try changing your filters</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}