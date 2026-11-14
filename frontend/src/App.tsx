import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LoginPage } from './pages/LoginPage'
import { SearchPage } from './pages/SearchPage'
import { FacultyProfilePage } from './pages/FacultyProfilePage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { authService } from './services/auth.service'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Root redirects to login or search based on auth status */}
          <Route
            path="/"
            element={
              authService.isAuthenticated()
                ? <Navigate to="/search" replace />
                : <Navigate to="/login" replace />
            }
          />

          {/* Login page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/:id"
            element={
              <ProtectedRoute>
                <FacultyProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}

export default App
