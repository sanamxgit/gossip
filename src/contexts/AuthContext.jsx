"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      // In a real app, make API call to login
      // Simulating API call
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Mock user data
          if (email === "user@example.com" && password === "password") {
            const userData = {
              id: 1,
              email: "user@example.com",
              username: "User",
              role: "user",
            }
            setUser(userData)
            localStorage.setItem("user", JSON.stringify(userData))
            resolve(userData)
          } else if (email === "seller@example.com" && password === "password") {
            const userData = {
              id: 2,
              email: "seller@example.com",
              username: "Seller",
              role: "seller",
              storeName: "My Store",
            }
            setUser(userData)
            localStorage.setItem("user", JSON.stringify(userData))
            resolve(userData)
          } else if (email === "admin@example.com" && password === "password") {
            const userData = {
              id: 3,
              email: "admin@example.com",
              username: "Admin",
              role: "admin",
            }
            setUser(userData)
            localStorage.setItem("user", JSON.stringify(userData))
            resolve(userData)
          } else {
            reject(new Error("Invalid credentials"))
          }
        }, 1000)
      })
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      // In a real app, make API call to register
      // Simulating API call
      return new Promise((resolve) => {
        setTimeout(() => {
          const newUser = {
            id: Date.now(),
            ...userData,
            role: userData.role || "user",
          }
          setUser(newUser)
          localStorage.setItem("user", JSON.stringify(newUser))
          resolve(newUser)
        }, 1000)
      })
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  const updateProfile = async (updatedData) => {
    try {
      // In a real app, make API call to update profile
      return new Promise((resolve) => {
        setTimeout(() => {
          const updatedUser = { ...user, ...updatedData }
          setUser(updatedUser)
          localStorage.setItem("user", JSON.stringify(updatedUser))
          resolve(updatedUser)
        }, 1000)
      })
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
