export default function MapEmbed({ destination, activities=[] }) {
  const loc   = activities[0]?.location || destination
  const query = encodeURIComponent(`${loc}, ${destination}, India`)
  const url   = import.meta.env.VITE_GOOGLE_MAPS_KEY
    ? `https://www.google.com/maps/embed/v1/search?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&q=${query}`
    : `https://maps.google.com/maps?q=${query}&output=embed`
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <iframe title="Map" src={url} width="100%" height="400" style={{border:0}} allowFullScreen loading="lazy"/>
    </div>
  )
}