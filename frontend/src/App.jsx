import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import AdminLayout from './components/AdminLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Pricing from './pages/Pricing'
import ForCandidates from './pages/ForCandidates'
import ForRecruiters from './pages/ForRecruiters'
import RecruiterDashboard from './pages/RecruiterDashboard'
import CandidateDashboard from './pages/CandidateDashboard'
import CreateJob from './pages/CreateJob'
import EditJob from './pages/EditJob'
import JobApplications from './pages/JobApplications'
import CandidateLayout from './components/CandidateLayout'
import CandidateApplications from './pages/candidate/CandidateApplications'
import CandidateProfile from './pages/candidate/CandidateProfile'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPlans from './pages/admin/AdminPlans'
import AdminSettings from './pages/admin/AdminSettings'
import AdminFiles from './pages/admin/AdminFiles'
import AdminDatabase from './pages/admin/AdminDatabase'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  if (!user) return <Navigate to="/login" />
  if (role && user.role !== role) return <Navigate to="/" />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>
  if (!user || user.role !== 'admin') return <Navigate to="/login" />
  return <AdminLayout>{children}</AdminLayout>
}

export default function App() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const isCandidate = location.pathname.startsWith('/candidate')

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isAdmin ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/plans" element={<AdminRoute><AdminPlans /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/admin/files" element={<AdminRoute><AdminFiles /></AdminRoute>} />
        <Route path="/admin/database" element={<AdminRoute><AdminDatabase /></AdminRoute>} />
      </Routes>
    )
  }

  if (isCandidate) {
    if (!user || user.role !== 'candidate') return <Navigate to="/login" />
    return (
      <CandidateLayout>
        <Routes>
          <Route path="/candidate" element={<CandidateDashboard />} />
          <Route path="/candidate/jobs" element={<Jobs />} />
          <Route path="/candidate/jobs/:id" element={<JobDetail />} />
          <Route path="/candidate/applications" element={<CandidateApplications />} />
          <Route path="/candidate/profile" element={<CandidateProfile />} />
        </Routes>
      </CandidateLayout>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={user && user.role === 'recruiter' ? <Navigate to="/recruiter" /> : user && user.role === 'candidate' ? <Navigate to="/candidate" /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'recruiter' ? '/recruiter' : '/candidate'} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'recruiter' ? '/recruiter' : '/candidate'} /> : <Register />} />
        <Route path="/para-candidatos" element={<ForCandidates />} />
        <Route path="/para-recrutadores" element={<ForRecruiters />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/jobs" element={user?.role === 'candidate' ? <Navigate to="/candidate/jobs" /> : <Jobs />} />
        <Route path="/jobs/:id" element={user?.role === 'candidate' ? <Navigate to={`/candidate${location.pathname}`} /> : <JobDetail />} />
        <Route path="/recruiter" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
        <Route path="/recruiter/create" element={<ProtectedRoute role="recruiter"><CreateJob /></ProtectedRoute>} />
        <Route path="/recruiter/edit/:id" element={<ProtectedRoute role="recruiter"><EditJob /></ProtectedRoute>} />
        <Route path="/recruiter/jobs/:id/applications" element={<ProtectedRoute role="recruiter"><JobApplications /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}
