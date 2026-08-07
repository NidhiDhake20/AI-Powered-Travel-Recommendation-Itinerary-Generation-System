export default function WeatherWidget({ weather }) {
  if (!weather) return null
  const emoji = c => {
    const l = (c||'').toLowerCase()
    if (l.includes('rain'))    return '🌧️'
    if (l.includes('cloud'))   return '⛅'
    if (l.includes('sun')||l.includes('clear')) return '☀️'
    if (l.includes('snow'))    return '❄️'
    if (l.includes('thunder')) return '⛈️'
    return '🌤️'
  }
  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl p-4 flex items-center gap-4">
      <div className="text-4xl">{emoji(weather.condition)}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-700">{weather.condition||'Clear'}</p>
        <p className="text-xs text-gray-500">{weather.min_temp}°C — {weather.max_temp}°C</p>
      </div>
      <div className="text-right text-xs text-gray-500 space-y-1">
        <p>💧 {weather.humidity||65}%</p>
        <p>🌧️ {weather.rain_chance||0}% rain</p>
        <p>💨 {weather.wind_kph||10} km/h</p>
      </div>
    </div>
  )
}