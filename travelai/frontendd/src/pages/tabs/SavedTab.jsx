import { useState, useEffect } from 'react'
import { getSavedTrips }        from '../../services/apiService'
import { TYPE_ICONS, PURPOSE_ICONS } from '../../config'

export default function SavedTab({ onLoadTrip }) {
  const [trips,   setTrips]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    getSavedTrips()
      .then(r => setTrips(r.trips || []))
      .catch(() => setError('Failed to load saved trips'))
      .finally(() => setLoading(false))
  }, [])

  function handleLoad(trip) {
    const dest = {
      name: trip.destination, state: trip.state, type: trip.type,
      trip_id: trip.id, ml_score: trip.ml_score, api_score: trip.api_score,
      final_score: trip.final_score, image_url: trip.image_url,
    }
    const f = {
      age_range: trip.age_range, budget_inr: trip.budget_inr,
      num_adults: trip.num_adults, num_children: trip.num_children,
      no_of_days: trip.no_of_days, purpose: trip.purpose,
      health_issue: trip.health_issue, interests: trip.interests || [],
      cuisine_type: trip.cuisine_type || '',
    }
    onLoadTrip(dest, f)
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-center">
      <div className="text-5xl mb-4 animate-pulse">🔖</div>
      <p className="text-gray-400">Loading saved trips...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Saved Trips</h2>
          <p className="text-gray-400 mt-1">{trips.length > 0 ? `${trips.length} trips saved` : 'No trips saved yet'}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-5 py-4 rounded-2xl mb-6 text-sm">{error}</div>}

      {trips.length === 0 && !error && (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Saved Trips Yet</h3>
          <p className="text-gray-400 text-sm">Plan a trip from the Recommend tab and save it here.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {trips.map(trip => (
          <div key={trip.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
            <div className="relative h-40 overflow-hidden">
              <img src={trip.image_url || `https://source.unsplash.com/600x300/?${trip.destination?.split(' ')[0]?.toLowerCase()},india`}
                alt={trip.destination}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={e => { e.target.src = `https://source.unsplash.com/600x300/?india,travel` }}/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
              <div className="absolute bottom-3 left-4 text-white">
                <h3 className="font-bold text-lg">{TYPE_ICONS[trip.type]} {trip.destination}</h3>
                <p className="text-white/70 text-xs">📍 {trip.state}</p>
              </div>
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {trip.final_score?.toFixed(0)}/100
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[['Duration', `${trip.no_of_days} Days`], ['Budget', `₹${trip.budget_inr?.toLocaleString()}`], ['Travelers', `${trip.num_adults}A${trip.num_children > 0 ? `+${trip.num_children}K` : ''}`], ['Purpose', `${PURPOSE_ICONS[trip.purpose] || ''} ${trip.purpose}`]].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 rounded-2xl p-2.5">
                    <p className="text-xs text-gray-400">{l}</p>
                    <p className="font-semibold text-gray-800 text-xs mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
              {trip.interests?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {trip.interests.slice(0, 3).map(i => <span key={i} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{i}</span>)}
                  {trip.interests.length > 3 && <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">+{trip.interests.length - 3}</span>}
                </div>
              )}
              <p className="text-xs text-gray-400 mb-4">Saved {new Date(trip.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <button onClick={() => handleLoad(trip)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold text-sm transition-all">
                Load Trip →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}