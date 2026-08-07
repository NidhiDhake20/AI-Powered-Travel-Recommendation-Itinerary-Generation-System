import { useState }    from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register }    from '../services/authService'
import LangSwitcher    from '../components/LangSwitcher'

export default function RegisterPage() {
  const navigate           = useNavigate()
  const [name,   setName]  = useState('')
  const [email,  setEmail] = useState('')
  const [pass,   setPass]  = useState('')
  const [error,  setError] = useState('')
  const [loading,setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (pass.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(name, email, pass)
      navigate('/dashboard')
    } catch (err) {
      const m = err.message || ''
      if (m.includes('email-already-in-use'))
        setError('Email already registered. Please login.')
      else if (m.includes('weak-password'))
        setError('Password is too weak. Use at least 6 characters.')
      else if (m.includes('invalid-email'))
        setError('Invalid email address.')
      else
        setError('Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">

      {/* Navbar */}
      <nav className="px-8 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-3xl">✈️</span>
          <span className="text-2xl font-bold text-gray-900">TravelAI</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">Already have an account?</span>
          <LangSwitcher />
          <Link to="/login" className="border-2 border-gray-200 hover:border-blue-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold transition-all">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Create your account</h1>
            <p className="text-gray-500 text-lg">Start planning your perfect Indian trip today</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your full name" required
                  className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 text-gray-800 placeholder-gray-300 transition-colors text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 text-gray-800 placeholder-gray-300 transition-colors text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input type="password" value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="At least 6 characters" required
                  className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 text-gray-800 placeholder-gray-300 transition-colors text-sm"/>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-5 py-4 rounded-2xl flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-2xl font-bold text-base transition-all mt-2 shadow-lg shadow-blue-100">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create Account →'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="flex justify-center gap-6 text-xs text-gray-400">
                {['40 Indian Destinations', 'Free Forever', 'AI-Powered'].map(f => (
                  <div key={f} className="flex items-center gap-1">
                    <span className="text-green-500">✓</span> {f}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}