import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Sun, Moon, User, Menu, X } from 'lucide-react'
import NotificationCenter from './NotificationCenter'

export default function Header({ isDarkMode, toggleDarkMode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Use the existing auth context
  const { user, isAuthenticated, logout, loading } = useAuth()

  return (
    <header className="relative flex items-center justify-between flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2"> 
        <Image 
          src="/LOGO_.png"
          alt="Logo Ecodeli"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <span className="text-2xl font-bold text-black dark:text-white">ecodeli</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="items-center hidden gap-6 md:flex">
        {user && (
          <>
            <Link 
              href="/dashboard"
              className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
            >
              Dashboard
            </Link>
            
            {/* Services navigation for customers and service providers */}
            {(user.role === 'CUSTOMER' || user.role === 'SERVICE_PROVIDER') && (
              <Link 
                href="/services/browse"
                className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
              >
                Services
              </Link>
            )}
            
            {/* Storage boxes for all users */}
            <Link 
              href="/storage/browse"
              className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
            >
              Storage
            </Link>
            
            {/* Contracts for merchants */}
            {user.role === 'MERCHANT' && (
              <Link 
                href="/contracts/manage"
                className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
              >
                Contracts
              </Link>
            )}
            
            {/* Carrier specific links */}
            {user.role === 'CARRIER' && (
              <Link 
                href="/packages"
                className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
              >
                Colis Disponibles
              </Link>
            )}
            
            <Link 
              href="/matches/pending"
              className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
            >
              Demandes
            </Link>
            <Link 
              href="/trajet"
              className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
            >
              Trajets
            </Link>
          </>
        )}
      </nav>

      {/* Desktop Buttons */}
      <div className="items-center hidden gap-4 md:flex">
        {/* Notification Center */}
        {user && <NotificationCenter user={user} />}
        
        <button
          onClick={toggleDarkMode}
          className="p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" />
          ) : (
            <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
          )}
        </button>
        
        {!loading && (
          user ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-sky-400 text-white font-medium px-5 py-2 rounded-full hover:bg-sky-500 transition flex items-center justify-center w-[60px] h-[40px]"
                aria-label="Ouvrir le menu utilisateur"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                <User className="w-6 h-6" />
              </button>

              {isDropdownOpen && (
                <div 
                  className="absolute right-0 z-50 w-48 py-1 mt-2 bg-white rounded-md shadow-lg dark:bg-gray-800"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <Link 
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Mon Profil
                  </Link>
                  <Link 
                    href="/profile/edit"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Paramètres
                  </Link>
                  <button
                    onClick={async () => {
                      await logout()
                      setIsDropdownOpen(false)
                      setIsMenuOpen(false)
                    }}
                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login"
              className="bg-sky-400 text-white font-medium px-2 py-2 rounded-full hover:bg-sky-500 transition w-[145px] h-[40px] flex items-center justify-center"
            >
              Me connecter
            </Link>
          )
        )}
        {loading && (
           <div className="bg-sky-400 rounded-full w-[60px] h-[40px] animate-pulse"></div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="p-2 md:hidden"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? (
          <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
        ) : (
          <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />
        )}
      </button>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 ease-in-out z-20 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        {/* Mobile Navigation */}
        {user && (
          <nav className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/dashboard"
                className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              
              {/* Services navigation for customers and service providers */}
              {(user.role === 'CUSTOMER' || user.role === 'SERVICE_PROVIDER') && (
                <Link 
                  href="/services/browse"
                  className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Services
                </Link>
              )}
              
              {/* Storage boxes for all users */}
              <Link 
                href="/storage/browse"
                className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Storage
              </Link>
              
              {/* Contracts for merchants */}
              {user.role === 'MERCHANT' && (
                <Link 
                  href="/contracts/manage"
                  className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contracts
                </Link>
              )}
              
              {user.role === 'CARRIER' && (
                <Link 
                  href="/packages"
                  className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Colis Disponibles
                </Link>
              )}
              <Link 
                href="/matches/pending"
                className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Demandes
              </Link>
              <Link 
                href="/trajet"
                className="text-gray-700 transition-colors dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Trajets
              </Link>
            </div>
          </nav>
        )}
        
        <div className="flex items-center justify-between p-4">
           <button
            onClick={toggleDarkMode}
            className="p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
               <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" />
             ) : (
               <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
             )}
           </button>
           
           {!loading && (
            user ? (
              <div className="flex flex-col w-full space-y-2">
                <Link 
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mon Profil
                </Link>
                <Link 
                  href="/profile/edit"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Paramètres
                </Link>
                <button
                  onClick={async () => {
                    await logout()
                    setIsMenuOpen(false)
                  }}
                  className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className="bg-sky-400 text-white font-medium px-2 py-2 rounded-full hover:bg-sky-500 transition w-[145px] h-[40px] flex items-center justify-center"
              >
                Me connecter
              </Link>
            )
          )}
          {loading && (
             <div className="bg-sky-400 rounded-full w-[60px] h-[40px] animate-pulse"></div>
          )}
        </div>
      </div>
    </header>
  )
} 