import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import LangSwitcher    from '../components/LangSwitcher'

const FEATURES = [
  { icon: '🤖', title: 'AI-Powered Recommendations', desc: 'Our hybrid ML model combined with Google Places API finds the perfect Indian destination tailored to your preferences, budget, and health considerations.' },
  { icon: '🗺️', title: 'Smart Itinerary Planning',   desc: '6 specialized Gemini AI agents collaborate to build your complete day-by-day travel plan with real venues, restaurants, weather, and transport advice.' },
  { icon: '💰', title: 'Budget Tracker',              desc: 'Track every rupee of your trip in real time. Add expenses, see category breakdowns, and stay within your budget with smart alerts.' },
  { icon: '🌤️', title: 'Weather-Aware Planning',     desc: 'Live weather forecasts integrated into your itinerary. Our AI adjusts activity suggestions based on expected conditions every day.' },
  { icon: '🍛', title: 'Cuisine Recommendations',    desc: 'Discover authentic local restaurants and must-try dishes with cultural context, matched to your cuisine preferences and dietary needs.' },
  { icon: '🚗', title: 'Transport & Logistics',       desc: 'Complete transport guide with fare estimates, nearby ATMs, pharmacies, and local tips so you never feel lost at your destination.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Set Your Preferences', desc: 'Tell us your age, budget, interests, group size, health considerations, and cuisine preferences.' },
  { step: '02', title: 'Get AI Recommendations', desc: 'Our ML model and Google Places API analyze 40 Indian destinations and recommend your top 3-5 matches.' },
  { step: '03', title: 'Generate Itinerary', desc: '6 Gemini AI agents build your complete day-by-day plan with real venues, food, weather, and transport.' },
  { step: '04', title: 'Travel & Track', desc: 'Follow your itinerary, track expenses, chat with TravelBot, and export your plan as a PDF.' },
]

const DESTINATIONS = [
  { name: 'Coorg',             type: 'Nature',     emoji: '🌿', img: 'https://images.unsplash.com/photo-1710612198146-77512950a4b7' },
  { name: 'Leh Ladakh',        type: 'Adventure',  emoji: '🏔️', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6syC-08_34gV3HDUrcoT836XfFU1TJFrrucb9MfdLPiXz7ULyfUkGJEq2&s=10' },
  { name: 'Baga Beach',        type: 'Beach',      emoji: '🏖️', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeseYB8OMIYAnzRmlYP6matYpojVkK9lRx0Wgn7x8BYcxvxjfwm4QrUxM&s=10' },
  { name: 'Taj Mahal',         type: 'Historical', emoji: '🏛️', img: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Taj_Mahal_%28Edited%29.jpeg' },
  { name: 'Kerala Backwaters', type: 'Nature',     emoji: '🌿', img: 'https://www.backpackadventures.org/wp-content/uploads/2020/08/india0898.jpg' },
  { name: 'Jaipur',            type: 'City',       emoji: '🏙️', img: 'https://t4.ftcdn.net/jpg/05/84/76/73/360_F_584767353_EXYOkE8NcX37UwV4WfBw7AjBaEtU6mMy.jpg' },
]

export default function HomePage() {
  const navigate     = useNavigate()
  const { isLoggedIn } = useAuth()

  return (
    <div className="min-h-screen bg-white">

      {/* ── PUBLIC NAVBAR ─────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-3xl">✈️</span>
            <span className="text-2xl font-bold text-gray-900">TravelAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">

            {['Features', 'How It Works', 'Destinations'].map(item => (
              <a key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-blue-600 font-semibold text-sm transition-colors px-4 py-2">
                  Login
                </button>
                <button onClick={() => navigate('/register')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md">
                  Get Started Free
                </button>
              </>
            )}
            <LangSwitcher />
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────── */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <span>🇮🇳</span> AI-Powered Indian Travel Planner
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Plan Your Perfect
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Indian Trip</span>
            <br />with AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            TravelAI combines Machine Learning and 6 specialized Gemini AI agents
            to recommend destinations, plan day-by-day itineraries, and guide your
            entire journey across 40 incredible Indian destinations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate(isLoggedIn ? '/dashboard' : '/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-blue-200 hover:-translate-y-0.5">
              Start Planning for Free →
            </button>
            <button onClick={() => navigate('/login')}
              className="border-2 border-gray-200 hover:border-blue-300 text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-blue-50">
              Sign In
            </button>
          </div>
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-500">
            {['40+ Destinations', '6 AI Agents', 'Real-time Data', 'Free to Use'].map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> {s}
              </div>
            ))}
          </div>
        </div>

        {/* Hero destination cards */}
        <div className="max-w-7xl mx-auto px-6 mt-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {DESTINATIONS.map(dest => (
              <div key={dest.name}
                className="relative rounded-2xl overflow-hidden h-36 cursor-pointer hover:scale-105 transition-transform shadow-md group">
                <img src={dest.img} alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={e => { e.target.src = `https://source.unsplash.com/400x300/?${dest.name.toLowerCase()},india` }}/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                <div className="absolute bottom-2 left-3 text-white">
                  <p className="font-bold text-sm">{dest.name}</p>
                  <p className="text-xs text-white/70">{dest.emoji} {dest.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Travel Smart</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Powered by cutting-edge AI, designed for the modern Indian traveler</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(f => (
              <div key={f.title}
                className="p-8 rounded-3xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all group cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────── */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How TravelAI Works</h2>
            <p className="text-xl text-gray-500">From preferences to perfect trip in minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-transparent z-0"/>
                )}
                <div className="relative z-10 bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-all">
                  <div className="text-5xl font-black text-blue-100 mb-4">{step.step}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS PREVIEW ──────────────── */}
      <section id="destinations" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">40 Incredible Indian Destinations</h2>
            <p className="text-xl text-gray-500">From Himalayan adventures to tropical beaches</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {DESTINATIONS.map(dest => (
              <div key={dest.name}
                className="relative rounded-3xl overflow-hidden h-56 cursor-pointer group shadow-md hover:shadow-xl transition-all">
                <img src={dest.img} alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={e => { e.target.src = `https://source.unsplash.com/600x400/?${dest.name.toLowerCase()},india` }}/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
                <div className="absolute bottom-4 left-5 text-white">
                  <p className="font-bold text-xl">{dest.name}</p>
                  <p className="text-white/70 text-sm">{dest.emoji} {dest.type}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => navigate(isLoggedIn ? '/dashboard' : '/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg">
              Explore All 40 Destinations →
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────── */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Plan Your Dream Trip?</h2>
          <p className="text-xl text-blue-100 mb-10">Join thousands of travelers who plan smarter with TravelAI</p>
          <button onClick={() => navigate(isLoggedIn ? '/dashboard' : '/register')}
            className="bg-white hover:bg-gray-50 text-blue-600 px-10 py-5 rounded-2xl font-bold text-xl transition-all shadow-xl hover:-translate-y-0.5">
            Start Planning for Free →
          </button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✈️</span>
            <span className="text-white font-bold text-xl">TravelAI</span>
          </div>
          <p className="text-sm">© 2025 TravelAI · AI-Powered Indian Travel Planner · Built with Gemini AI</p>
          <div className="flex gap-6 text-sm">
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-white cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>

    </div>
  )
}