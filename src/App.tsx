import { NavLink, Link, Route, Routes, useLocation } from 'react-router-dom'
import { AlertTriangle, Plus, SlidersHorizontal, Radar as RadarIcon, Tv, BookOpen } from 'lucide-react'
import Placeholder from './pages/Placeholder'
import Home from './pages/Home'
import VendorDetail from './pages/VendorDetail'
import Incidents from './pages/Incidents'
import Priorities from './pages/Priorities'
import Live from './pages/Live'
import Method from './pages/Method'
import GridOverlay from './components/GridOverlay'

const NAV = [
  { to: '/', label: 'Radar', icon: RadarIcon },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/priorities', label: 'Priorities', icon: SlidersHorizontal },
  { to: '/live', label: 'Live', icon: Tv },
  { to: '/method', label: 'Method', icon: BookOpen },
]

function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 9 L9 1.5 A7.5 7.5 0 0 1 16.5 9 Z" fill="var(--accent)" />
    </svg>
  )
}

export default function App() {
  const loc = useLocation()
  if (loc.pathname === '/live') return <><Live /><GridOverlay /></>
  return (
    <>
      <header className="nav">
        <div className="container">
          <Link to="/" className="wordmark"><Mark /> Risk Radar</Link>
          <nav className="nav-links" aria-label="Main">
            {NAV.map(n => <NavLink key={n.to} to={n.to} end={n.to === '/'}>{n.label}</NavLink>)}
          </nav>
          <div className="nav-right">
            <Link to="/incidents?new=1" className="btn">Report incident</Link>
            <Link to="/incidents?new=1" className="plus" aria-label="Report incident"><Plus size={20} strokeWidth={2} /></Link>
          </div>
        </div>
      </header>
      <main>
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vendors/:id" element={<VendorDetail />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/priorities" element={<Priorities />} />
            <Route path="/method" element={<Method />} />
            <Route path="/compare" element={<Placeholder title="Compare" />} />
          </Routes>
          <footer className="footer footnote">All vendors, incidents and numbers are fictional. BTMA 631 / BIMA 610, Haskayne School of Business.</footer>
        </div>
      </main>
      <nav className="tabbar" aria-label="Main mobile">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}>
            <n.icon size={24} strokeWidth={1.75} /><span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <GridOverlay />
    </>
  )
}
