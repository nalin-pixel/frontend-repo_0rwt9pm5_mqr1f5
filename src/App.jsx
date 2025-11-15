import React, { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, Bookmark, User as UserIcon, Star, LogIn, LogOut } from 'lucide-react'
import Spline from '@splinetool/react-spline'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!token) return
    fetch(`${BACKEND}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(setUser)
      .catch(() => setUser(null))
  }, [token])

  const login = async (email, password) => {
    const r = await fetch(`${BACKEND}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    if (!r.ok) throw new Error('Login failed')
    const data = await r.json()
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
  }

  const register = async (name, email, password) => {
    const r = await fetch(`${BACKEND}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
    if (!r.ok) throw new Error('Register failed')
    const data = await r.json()
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
  }

  const logout = () => { localStorage.removeItem('token'); setToken(null); setUser(null) }

  return { token, user, login, register, logout }
}

function Shell() {
  const location = useLocation()
  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Hero with Spline */}
      {location.pathname === '/' && (
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <Spline scene="https://prod.spline.design/fN2AgePov5Uh0jfA/scene.splinecode" style={{ width: '100%', height: '100%' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white pointer-events-none" />
          <div className="absolute inset-x-0 bottom-4 flex flex-col items-center text-center px-6">
            <h1 className="text-3xl md:text-4xl font-semibold">Minty Comics</h1>
            <p className="text-gray-600">Read, discover, and bookmark comics in a clean, modern reader.</p>
          </div>
        </div>
      )}
      <div className="flex-1">
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/comic/:id" element={<ComicDetail />} />
          <Route path="/chapter/:id" element={<ReaderPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

function BottomNav() {
  const location = useLocation()
  const nav = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/bookmarks', label: 'Bookmark', icon: Bookmark },
    { to: '/profile', label: 'Profile', icon: UserIcon },
  ]
  return (
    <nav className="sticky bottom-0 w-full bg-white border-t border-gray-100">
      <div className="mx-auto max-w-4xl grid grid-cols-4">
        {nav.map(item => {
          const Active = location.pathname === item.to
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to} className={`flex items-center justify-center gap-2 py-3 ${Active ? 'text-emerald-500' : 'text-gray-500'}`}>
              <Icon size={22} />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function Card({ children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition p-3">{children}</div>
  )
}

function HomePage() {
  const [loading, setLoading] = useState(true)
  const [latest, setLatest] = useState([])
  useEffect(() => {
    setLoading(true)
    fetch(`${BACKEND}/comics/latest`).then(r=>r.json()).then(d=>{setLatest(d); setLoading(false)})
  }, [])
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 -mt-10">
      <SectionTitle title="Latest" />
      {loading ? <SkeletonGrid /> : <ComicGrid comics={latest} />}
    </div>
  )
}

function SectionTitle({ title }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="h-1 w-24 rounded-full bg-emerald-200" />
    </div>
  )
}

function SkeletonGrid(){
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({length:8}).map((_,i)=> (
        <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
      ))}
    </div>
  )
}

function ComicGrid({ comics }){
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {comics.map(c => <ComicCard key={c.id} c={c} />)}
    </div>
  )
}

function ComicCard({ c }){
  return (
    <Link to={`/comic/${c.id}`} className="group">
      <div className="aspect-[3/4] w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
        <img src={c.cover_url} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between">
          <p className="font-medium truncate">{c.title}</p>
          <div className="flex items-center gap-1 text-emerald-500"><Star size={16}/><span className="text-sm">{c.rating?.toFixed?.(1) ?? '—'}</span></div>
        </div>
        <p className="text-xs text-gray-500 truncate">{c.genres?.join(', ')}</p>
      </div>
    </Link>
  )
}

function SearchPage(){
  const [q, setQ] = useState('')
  const [genre, setGenre] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const doSearch = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (genre) params.set('genre', genre)
    const r = await fetch(`${BACKEND}/comics?${params.toString()}`)
    setItems(await r.json())
    setLoading(false)
  }
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6">
      <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-3 md:flex-row md:items-center md:gap-2 md:p-2 md:pl-3">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search comics" className="flex-1 outline-none bg-transparent" />
        <select value={genre} onChange={e=>setGenre(e.target.value)} className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg">
          <option value="">All genres</option>
          <option>Adventure</option>
          <option>Comedy</option>
          <option>Fantasy</option>
          <option>Romance</option>
          <option>Sci-Fi</option>
        </select>
        <button onClick={doSearch} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg">Search</button>
      </div>
      <div className="mt-6">{loading ? <SkeletonGrid/> : <ComicGrid comics={items} />}</div>
    </div>
  )
}

function useParamsId(){
  const loc = useLocation()
  const id = loc.pathname.split('/').pop()
  return id
}

function ComicDetail(){
  const id = useParamsId()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(()=>{
    setLoading(true)
    fetch(`${BACKEND}/comics/${id}`).then(r=>r.json()).then(d=>{setData(d); setLoading(false)})
  }, [id])
  if (loading) return <div className="p-6">Loading...</div>
  if (!data) return <div className="p-6">Not found</div>
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img src={data.cover_url} alt={data.title} className="w-full object-cover" />
          </div>
        </div>
        <div className="md:col-span-2">
          <h1 className="text-2xl font-semibold">{data.title}</h1>
          <p className="text-gray-500">By {data.author || 'Unknown'}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.genres?.map(g => <span key={g} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs">{g}</span>)}
          </div>
          <p className="mt-3 text-gray-700 whitespace-pre-line">{data.synopsis}</p>
          <h3 className="mt-6 mb-2 font-medium">Chapters</h3>
          <div className="space-y-2">
            {data.chapters?.map(ch => (
              <Link key={ch.id} to={`/chapter/${ch.id}`} className="block bg-white rounded-lg border border-gray-100 shadow-sm p-3 hover:shadow-md">
                Chapter {ch.number}: {ch.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReaderPage(){
  const id = useParamsId()
  const [data, setData] = useState(null)
  useEffect(()=>{ fetch(`${BACKEND}/chapters/${id}`).then(r=>r.json()).then(setData) }, [id])
  if (!data) return <div className="p-6">Loading...</div>
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <h1 className="text-xl font-semibold mb-4">{data.title}</h1>
      <div className="flex flex-col gap-3">
        {data.images?.map((src, i) => (
          <img key={i} src={src} alt={`Page ${i+1}`} className="w-full rounded-lg shadow-sm bg-gray-100" loading="lazy" />
        ))}
      </div>
    </div>
  )
}

function BookmarksPage(){
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(()=>{
    if (!token){ setLoading(false); return }
    fetch(`${BACKEND}/bookmarks`, { headers: { Authorization: `Bearer ${token}` }}).then(r=>r.json()).then(d=>{setItems(d); setLoading(false)})
  }, [token])
  if (!token) return <AuthPrompt />
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6">
      {loading ? <SkeletonGrid/> : <ComicGrid comics={items} />}
    </div>
  )
}

function AuthPrompt(){
  const nav = useNavigate()
  return (
    <div className="p-6 text-center">
      <p className="text-gray-600">Please sign in to view this section.</p>
      <button onClick={()=>nav('/auth')} className="mt-3 bg-emerald-500 text-white px-4 py-2 rounded-lg">Sign in</button>
    </div>
  )
}

function ProfilePage(){
  const { user, logout } = useAuth()
  const nav = useNavigate()
  if (!user) return <AuthPrompt />
  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-6">
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="ml-auto">
            <button onClick={()=>{logout(); nav('/')}} className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-2"><LogOut size={18}/> Logout</button>
          </div>
        </div>
      </Card>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <Card><p className="font-medium mb-1">Reading history</p><p className="text-gray-500 text-sm">Coming soon</p></Card>
        <Card><p className="font-medium mb-1">Settings</p><p className="text-gray-500 text-sm">Light, minimalist UI with mint accents.</p></Card>
      </div>
    </div>
  )
}

function AuthPage(){
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'login') await login(email, password)
      else await register(name, email, password)
      window.history.back()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-1">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p className="text-sm text-gray-500 mb-4">Use your email and password to continue.</p>
        {mode === 'register' && (
          <div className="mb-3">
            <label className="text-sm text-gray-600">Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-gray-50 rounded-lg px-3 py-2 mt-1 outline-none" required />
          </div>
        )}
        <div className="mb-3">
          <label className="text-sm text-gray-600">Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-gray-50 rounded-lg px-3 py-2 mt-1 outline-none" required />
        </div>
        <div className="mb-2">
          <label className="text-sm text-gray-600">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-gray-50 rounded-lg px-3 py-2 mt-1 outline-none" required />
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        <button className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <button type="button" onClick={()=>setMode(mode === 'login' ? 'register' : 'login')} className="mt-3 w-full text-emerald-700 hover:text-emerald-800">{mode==='login' ? 'No account? Create one' : 'Have an account? Sign in'}</button>
      </form>
    </div>
  )
}

export default function App(){
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}
