import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../sidebar/sidebar'
import './AppLayout.css'

const MOBILE_BREAKPOINT = 850

const AppLayout = ({ onLogout }) => {
  const [navOpen, setNavOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= MOBILE_BREAKPOINT
    }
    return false
  })
  const location = useLocation()

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (navOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [navOpen])

  const shouldShowSidebar = !isMobile || navOpen

  return (
    <div className="sendero-page">
      {isMobile && navOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setNavOpen(false)} />
      )}

      {shouldShowSidebar && (
        <Sidebar
          onLogout={onLogout}
          isMobile={isMobile}
          open={navOpen}
          onClose={() => setNavOpen(false)}
        />
      )}

      <Outlet context={{ isMobile, navOpen, setNavOpen }} />
    </div>
  )
}

export default AppLayout
