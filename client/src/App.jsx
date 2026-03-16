import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from './context/AuthContext'

//pages
import Login from './pages/Login'
import Register from './pages/Register'

//client pages
import AcasaClient from './pages/client/AcasaClient'
import DetaliiCofetarie from './pages/client/DetaliiCofetarie'
import CosCumparaturi from './pages/client/CosCumparaturi'
import IstoricComenzi from './pages/client/IstoricComenzi'

//cofetarie pages
import DashboardCofetarie from './pages/cofetarie/DashboardCofetarie'
import GestionareProduse from './pages/cofetarie/GestionareProduse'
import GestionareComenzi from './pages/cofetarie/GestionareComenzi'

//admin pages
import DashboardAdmin from './pages/admin/DashboardAdmin'

const ProtectedRoute = ({ children, rol }) => {
  const { utilizator, loading } = useContext(AuthContext)

  if (loading) return null

  if(!utilizator) return <Navigate to="/login" />
  if(rol && utilizator.rol !== rol) return <Navigate to="/login" />
  return children
}

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/*client*/}
        <Route path="/" element={<ProtectedRoute rol="client"><AcasaClient /></ProtectedRoute>} />
        <Route path="/cofetarie/:id" element={<ProtectedRoute rol="client"><DetaliiCofetarie /></ProtectedRoute>} />
        <Route path="/cos-cumparaturi" element={<ProtectedRoute rol="client"><CosCumparaturi /></ProtectedRoute>} />
        <Route path="/comenzile-mele" element={<ProtectedRoute rol="client"><IstoricComenzi /></ProtectedRoute>} />

        {/*cofetarie*/}
        <Route path="/cofetarie/dashboard" element={<ProtectedRoute rol="cofetarie"><DashboardCofetarie /></ProtectedRoute>} />
        <Route path="/cofetarie/produse" element={<ProtectedRoute rol="cofetarie"><GestionareProduse/></ProtectedRoute>} />
        <Route path="/cofetarie/comenzi" element={<ProtectedRoute rol="cofetarie"><GestionareComenzi /></ProtectedRoute>} />

        {/*admin*/}
        <Route path="/admin/dashboard" element={<ProtectedRoute rol="admin"><DashboardAdmin /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App