import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Merge from './Components/Merge'
import Layout from './Components/Layout'
import PPC from './Components/PPC'

function Routing() {
  console.log('routing')
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />} path="/">
          <Route element={<Merge />} path="/mergeXlsx" />
          <Route element={<PPC />} path="/ppc" />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Routing
