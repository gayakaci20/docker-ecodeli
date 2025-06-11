import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { Sun, Moon, User } from 'lucide-react'

export default function Profile({ isDarkMode, toggleDarkMode }) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Rediriger vers la page de connexion si non connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading]);

  // Gérer la déconnexion
  const handleLogout = async () => {
    await logout();
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-t-2 border-b-2 rounded-full animate-spin border-sky-500"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Mon Profil - ecodeli</title>
        <meta name="description" content="Gérez votre profil ecodeli" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow dark:bg-gray-800">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center">
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
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" />
              ) : (
                <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-white transition-colors bg-red-500 rounded-md hover:bg-red-600"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
          {/* En-tête du profil */}
          <div className="relative px-6 py-16 bg-sky-500">
            <div className="absolute bottom-0 transform -translate-x-1/2 translate-y-1/2 left-1/2">
              <div className="flex items-center justify-center w-24 h-24 bg-gray-200 border-4 border-white rounded-full dark:bg-gray-700 dark:border-gray-800">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Informations du profil */}
          <div className="px-6 pt-16 pb-6">
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-1 text-center text-gray-500 dark:text-gray-400">
              {user.role === 'SENDER' ? 'Expéditeur' : user.role === 'CARRIER' ? 'Transporteur' : 'Administrateur'}
            </p>
          </div>
          
          {/* Détails du profil */}
          <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{user.email}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{user.phoneNumber || 'Non renseigné'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresse</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{user.address || 'Non renseignée'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Membre depuis</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
            </dl>
          </div>
          
          {/* Actions */}
          <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap justify-center gap-4 md:justify-start">
              <Link 
                href="/settings"
                className="px-4 py-2 text-gray-800 transition-colors bg-gray-100 rounded-md dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white"
              >
                Modifier mon profil
              </Link>
              {user.role === 'ADMIN' ? (
                <Link 
                  href="/admin"
                  className="px-4 py-2 text-white transition-colors rounded-md bg-sky-500 hover:bg-sky-600"
                >
                  Dashboard Admin
                </Link> 
              ) : (
                <Link 
                  href="/exp"
                  className="px-4 py-2 text-white transition-colors rounded-md bg-sky-500 hover:bg-sky-600"
                >
                  Expédier un colis
                </Link>
              )}
              
              {user.role === 'CARRIER' && (
                <Link 
                  href="/trajet/create"
                  className="px-4 py-2 text-white transition-colors bg-green-500 rounded-md hover:bg-green-600"
                >
                  Proposer un trajet
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Section des colis ou trajets récents */}
        <div className="grid grid-cols-1 gap-8 mt-8 md:grid-cols-2">
          {/* Colis récents */}
          <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mes colis récents</h2>
            </div>
            <div className="px-6 py-4">
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                Vous n'avez pas encore de colis.
              </p>
              {/* Ici, vous pourriez afficher une liste de colis si l'utilisateur en a */}
            </div>
          </div>
          
          {/* Trajets récents (pour les transporteurs) */}
          {user.role === 'CARRIER' && (
            <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mes trajets récents</h2>
              </div>
              <div className="px-6 py-4">
                <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Vous n'avez pas encore proposé de trajet.
                </p>
                {/* Ici, vous pourriez afficher une liste de trajets si l'utilisateur en a */}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}