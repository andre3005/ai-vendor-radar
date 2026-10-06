import { NavLink, Link, Route, Routes, useLocation } from 'react-router-dom'
import Placeholder from './pages/Placeholder'
import Home from './pages/Home'
import VendorDetail from './pages/VendorDetail'
import Incidents from './pages/Incidents'
import Priorities from './pages/Priorities'
import Live from './pages/Live'
import Method from './pages/Method'

const NAV = [
  { to: '/', label: 'Radar' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/priorities', label: 'Priorities' },
  { to: '/live', label: 'Live' },
  { to: '/method', label: 'Method' },
]

export default function App() {
  const live = useLocation().pathname === '/live'
  if (live) return <Live />
  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Link to="/" className="wordmark">◎ Risk Radar</Link>
          <nav className="nav-links" aria-label="Main">
            {NAV.map(n => <NavLink key={n.to} to={n.to} end={n.to === '/'}>{n.label}</NavLink>)}
          </nav>
          <span className="spacer" />
          <Link to="/incidents?new=1" className="btn">Report incident</Link>
        </div>
      </header>
      <main>
        <div className="wrap">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vendors/:id" element={<VendorDetail />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/priorities" element={<Priorities />} />
            <Route path="/live" element={<Live />} />
            <Route path="/method" element={<Method />} />
            <Route path="/compare" element={<Placeholder title="Compare" />} />
          </Routes>
          <footer>All vendors, incidents and numbers are fictional. BTMA 631 / BIMA 610, Haskayne School of Business.</footer>
        </div>
      </main>
      <nav className="tabbar" aria-label="Main mobile">
        {NAV.map(n => <NavLink key={n.to} to={n.to} end={n.to === '/'}>{n.label}</NavLink>)}
      </nav>
    </>
  )
}
