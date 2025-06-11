import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Vérifier s'il y a un token dans le localStorage
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken')
        if (token) {
          // Valider le token avec l'API
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const userData = await response.json()
            setUser(userData.user)
            setIsAuthenticated(true)
          } else {
            // Token invalide, nettoyer le localStorage
            localStorage.removeItem('authToken')
            setUser(null)
            setIsAuthenticated(false)
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        // Stocker le token
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', data.token)
        }
        
        setUser(data.user)
        setIsAuthenticated(true)
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Erreur de connexion' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Erreur de connexion' }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (response.ok) {
        // Stocker le token
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', data.token)
        }
        
        setUser(data.user)
        setIsAuthenticated(true)
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Erreur d\'inscription' }
      }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, error: 'Erreur d\'inscription' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Appeler l'API de déconnexion si nécessaire
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken')
        if (token) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        }
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Nettoyer le localStorage et l'état
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
      }
      
      setUser(null)
      setIsAuthenticated(false)
      
      // Rediriger seulement côté client
      if (typeof window !== 'undefined' && router) {
        router.push('/')
      }
    }
  }

  const updateUser = (userData) => {
    setUser(userData)
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext 