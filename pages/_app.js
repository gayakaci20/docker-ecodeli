import '../styles/globals.css'
import { useState, useEffect } from 'react'
import { AuthProvider } from '../contexts/AuthContext'

function MyApp({ Component, pageProps }) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur a une préférence de thème
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const savedTheme = localStorage.getItem('theme')
      
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setIsDarkMode(true)
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    if (typeof window !== 'undefined') {
      if (!isDarkMode) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    }
  }

  return (
    <AuthProvider>
      <Component {...pageProps} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
    </AuthProvider>
  )
}

export default MyApp