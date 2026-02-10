import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import PublicBooking from './pages/PublicBooking'
import Login from './pages/Login'
import Register from './pages/register'
import AdminDashboard from './pages/AdminDashboard'
import Settings from './pages/Settings' // <--- IMPORT NOVO

function App() {
  return (
    <BrowserRouter basename="/agenda-garantida">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/settings" element={<Settings />} /> {/* <--- ROTA NOVA */}
        <Route path="/:slug" element={<PublicBooking />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App