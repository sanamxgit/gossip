"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import authService from "../services/api/authService"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true)
        // Check if token is valid
        const isValid = await authService.validateToken()
        
        if (isValid) {
          // Get current user data
          const userData = await authService.getCurrentUser()
          setUser(userData)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (err) {
        setError(err.message)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Register a new user
  const register = async (userData) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await authService.register(userData)
      setUser(result.user || result)
      setIsAuthenticated(true)
      
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const credentials = { email, password }
      const result = await authService.login(credentials)
      setUser(result.user || result)
      setIsAuthenticated(true)
      
      // Store user data in localStorage for other components to access
      if (result.user) {
        localStorage.setItem('userData', JSON.stringify(result.user))
      } else if (result && result._id) {
        localStorage.setItem('userData', JSON.stringify(result))
      }
      
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Logout user
  const logout = () => {
    authService.logout()
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('userData')
  }

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true)
      setError(null)
      
      const updatedUser = await authService.updateProfile(userData)
      setUser(updatedUser)
      
      return updatedUser
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Apply to become a seller
  const applyForSeller = async (sellerData) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await authService.applyForSeller(sellerData)
      
      // Update user data after application
      const updatedUser = await authService.getCurrentUser()
      setUser(updatedUser)
      
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Check if user has role
  const hasRole = (role) => {
    if (!user) return false
    return user.role === role
  }

  // Check if user is seller
  const isSeller = () => hasRole('seller')
  
  // Check if user is admin
  const isAdmin = () => hasRole('admin')

  // Reset error
  const clearError = () => setError(null)

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    updateProfile,
    applyForSeller,
    isSeller,
    isAdmin,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
