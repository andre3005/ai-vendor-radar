import { NavLink, Link, Route, Routes } from 'react-router-dom'
import Placeholder from './pages/Placeholder'
import Home from './pages/Home'

const NAV = [
  { to: '/', label: 'Radar' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/priorities', label: 'Priorities' },
  { to: '/live', label: 'Live' },
  { to: '/method', label: 'Method' },
]

export default function App() {
  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Link to="/" className="wordmark">◎ Risk Radar</Link>
          <nav className="nav-links" aria-label="Main">
            {NAV.map(n => <NavLink key={n.to} to={n.to} end={n.to === '/'}>{n.label}</NavLink>)}
          </nav>
          <span className="spacer" />
          <Link to="/incidents" className="btn">Report incident</Link>
        </div>
      </header>
      <main>
        <div className="wrap">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vendors/:id" element={<Placeholder title="Vendor" />} />
            <Route path="/incidents" element={<Placeholder title="Incidents" />} />
            <Route path="/priorities" element={<Placeholder title="Priorities" />} />
            <Route path="/live" element={<Placeholder title="Live" />} />
            <Route path="/method" element={<Placeholder title="Method" />} />
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
