import React, { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

function Layout() {
  let location = useLocation()
  console.log(location)
  let navigate = useNavigate()
  useEffect(() => {
    if (location.pathname == '/') navigate('/mergeXlsx')
  }, [])

  return (
    <>
      <header className="navbar">
        <span className="title">MathideXLSX</span>
        <Link to={'./mergeXlsx'} className={location.pathname == '/mergeXlsx' ? 'actual' : ''}>
          Merge
        </Link>
        <Link to={'./ppc'} className={location.pathname == '/ppc' ? 'actual' : ''}>
          PPC
        </Link>
      </header>
      <div className="appLayout">
        <Outlet />
      </div>
    </>
  )
}

export default Layout
