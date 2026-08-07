import { useState }    from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import { logout }      from '../services/authService'
import LangSwitcher    from '../components/LangSwitcher'
import RecommendTab    from './tabs/RecommendTab'
import ItineraryTab    from './tabs/ItineraryTab'
import SavedTab        from './tabs/SavedTab'
import ChatbotTab      from './tabs/ChatbotTab'


const TABS = [
  { id: 'recommend', label: 'Recommend',  icon: '🔍' },
  { id: 'itinerary', label: 'Itinerary',  icon: '🗺️' },
  { id: 'saved',     label: 'Saved Trips',icon: '🔖' },
  { id: 'chat',      label: 'AI Chat',    icon: '🤖' },
]

export default function DashboardPage() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const [activeTab,  setActiveTab]  = useState('recommend')
  const [selectedDest, setSelectedDest] = useState(null)
  const [filters,    setFilters]    = useState(null)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  // When user clicks Plan Trip from Recommend tab
  function handlePlanTrip(destination, tripFilters) {
    setSelectedDest(destination)
    setFilters(tripFilters)
    setActiveTab('itinerary')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── APP NAVBAR ──────────────────────── */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-0 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2 py-4 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl">✈️</span>
            <span className="text-xl font-bold text-gray-900">TravelAI</span>
          </div>

          {/* Tabs — center */}
          <div className="flex items-center">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-5 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <span>{tab.icon}</span>
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.displayName || 'Traveler'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <LangSwitcher />
            <button onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-all">
              Logout
            </button>
          </div>

        </div>
      </nav>

      {/* ── TAB CONTENT ─────────────────────── */}
      <div className="flex-1">
        {activeTab === 'recommend' && (
          <RecommendTab onPlanTrip={handlePlanTrip} />
        )}
        {activeTab === 'itinerary' && (
          <ItineraryTab
            initialDestination={selectedDest}
            initialFilters={filters}
            onClearDest={() => { setSelectedDest(null); setFilters(null) }}
          />
        )}
        {activeTab === 'saved' && (
          <SavedTab onLoadTrip={(dest, f) => { setSelectedDest(dest); setFilters(f); setActiveTab('itinerary') }} />
        )}
        {activeTab === 'chat' && (
          <ChatbotTab destination={selectedDest} filters={filters} />
        )}
      </div>

    </div>
  )
}