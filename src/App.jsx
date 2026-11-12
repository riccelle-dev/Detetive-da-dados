import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ListaCasos from './pages/ListaCasos'
import Caso from './pages/Caso'
import Admin from './pages/Admin'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<ListaCasos />} />
        <Route path="/caso/:id"   element={<Caso />} />
        <Route path="/admin"      element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
