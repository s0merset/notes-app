import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    const email = localStorage.getItem('email')
    const displayName = localStorage.getItem('displayName')
    return token ? { token, email, displayName } : null
  })

  const login = ({ token, email, displayName }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('email', email)
    localStorage.setItem('displayName', displayName)
    setUser({ token, email, displayName })
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
