import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X, 
  Plus, 
  Users, 
  Check, 
  DollarSign, 
  Heart, 
  Shield, 
  Zap, 
  Eye, 
  Star,
  Twitter,
  Facebook,
  Instagram
} from 'lucide-react'

export default function Home({ isDarkMode, toggleDarkMode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  // Désactivé temporairement pour la dockerisation
  const user = null
  const loading = false
  const logout = () => {}

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>ecodeli</title>
        <meta name="description" content="Livraison facile, écolo et moins chère" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Header */}
      <header className="relative flex items-center justify-between p-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image 
            src="/LOGO_.png"
            alt="Logo Ecodeli"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-2xl font-bold text-black dark:text-white">ecodeli</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden gap-8 font-medium text-gray-800 md:flex dark:text-gray-200">
          <Link href="#" className="hover:text-sky-500 dark:hover:text-sky-400">Accueil</Link>
          <Link href="/exp" className="hover:text-sky-500 dark:hover:text-sky-400">Expédier un colis</Link>
          <Link href="/trajet" className="hover:text-sky-500 dark:hover:text-sky-400">Voir les trajets</Link>
          <Link href="/solutions" className="hover:text-sky-500 dark:hover:text-sky-400">Nos solutions</Link>
          <Link href="#" className="hover:text-sky-500 dark:hover:text-sky-400">Tarifs</Link>
        </nav>

        {/* Desktop Buttons */}
        <div className="items-center hidden gap-4 md:flex">
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
        <div className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <nav className="flex flex-col p-4">
            <Link href="#" className="py-2 text-gray-800 dark:text-white hover:text-sky-500 dark:hover:text-sky-400">Accueil</Link>
            <Link href="/exp" className="py-2 text-gray-800 dark:text-white hover:text-sky-500 dark:hover:text-sky-400">Expédier un colis</Link>
            <Link href="#" className="py-2 text-gray-800 dark:text-white hover:text-sky-500 dark:hover:text-sky-400">Voir les trajets</Link>
            <Link href="/solutions" className="py-2 text-gray-800 dark:text-white hover:text-sky-500 dark:hover:text-sky-400">Nos solutions</Link>
            <Link href="#" className="py-2 text-gray-800 dark:text-white hover:text-sky-500 dark:hover:text-sky-400">Tarifs</Link>
            <div className="flex items-center justify-between mt-4">
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
                      >
                        <Link 
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                          onClick={() => { setIsDropdownOpen(false); setIsMenuOpen(false); }}
                        >
                          Mon Profil
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
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col-reverse items-center justify-between px-6 py-12 md:flex-row md:px-20 md:py-20">
        {/* Left Text Content */}
        <div className="text-center md:w-1/2 md:text-left">
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-6xl dark:text-white">
            Livraison facile, écolo <br />
            et moins chère.
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
            Envoyez vos colis partout en France en profitant de trajets déjà planifiés.
            C'est malin, économique et bon pour la planète. <br />
            Bienvenue sur ecodeli !
          </p>
          <div className="flex flex-col justify-center gap-4 mt-8 sm:flex-row md:justify-start">
            <Link href="/exp" className="px-6 py-3 font-medium text-white transition rounded-full bg-sky-400 hover:bg-sky-500">
              Envoyer un colis
            </Link>
            <Link href="/trajet" className="px-6 py-3 font-medium text-gray-800 transition bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">
              Voir les trajets disponibles
            </Link>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="flex justify-center mb-12 md:w-1/2 md:mb-0">
          <img 
            src="/pin.png" 
            alt="Illustration" 
            className="w-72 md:w-96"
          />
        </div>
      </main>

      {/* Comment ça marche */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-800 md:px-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 md:text-4xl dark:text-white">
            Comment ça marche ?
          </h2>
          <p className="mt-4 text-lg text-center text-gray-600 dark:text-gray-300">
            Livrer vos colis n'a jamais été aussi simple
          </p>
          
          <div className="grid gap-8 mt-12 md:grid-cols-3">
            {/* Étape 1 */}
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-sky-100 dark:bg-sky-900">
                <Plus className="w-8 h-8 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">1. Publiez votre colis</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Décrivez votre colis et indiquez les villes de départ et d'arrivée
              </p>
            </div>

            {/* Étape 2 */}
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-sky-100 dark:bg-sky-900">
                <Users className="w-8 h-8 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">2. Trouvez un transporteur</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Recevez des propositions de transporteurs qui font déjà le trajet
              </p>
            </div>

            {/* Étape 3 */}
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-sky-100 dark:bg-sky-900">
                <Check className="w-8 h-8 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">3. Votre colis est livré</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Suivez votre colis en temps réel jusqu'à sa livraison
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="px-6 py-16 md:px-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 md:text-4xl dark:text-white">
            Pourquoi choisir ecodeli ?
          </h2>
          
          <div className="grid gap-8 mt-12 md:grid-cols-2 lg:grid-cols-3">
            {/* Économique */}
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-green-100 rounded-lg dark:bg-green-900">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Économique</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Jusqu'à 70% moins cher que les transporteurs traditionnels
              </p>
            </div>

            {/* Écologique */}
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-green-100 rounded-lg dark:bg-green-900">
                <Heart className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Écologique</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Réduisez votre empreinte carbone en optimisant les trajets
              </p>
            </div>

            {/* Sécurisé */}
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-blue-100 rounded-lg dark:bg-blue-900">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sécurisé</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Transporteurs vérifiés et assurance incluse
              </p>
            </div>

            {/* Rapide */}
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-yellow-100 rounded-lg dark:bg-yellow-900">
                <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Rapide</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Livraison en 24-48h sur la plupart des trajets
              </p>
            </div>

            {/* Suivi */}
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-purple-100 rounded-lg dark:bg-purple-900">
                <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Suivi en temps réel</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Suivez votre colis à chaque étape de son voyage
              </p>
            </div>

            {/* Communauté */}
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-pink-100 rounded-lg dark:bg-pink-900">
                <Users className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Communauté</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Rejoignez une communauté de transporteurs de confiance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="px-6 py-16 bg-sky-50 dark:bg-sky-900/20 md:px-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 md:text-4xl dark:text-white">
            ecodeli en chiffres
          </h2>
          
          <div className="grid gap-8 mt-12 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-sky-600 dark:text-sky-400">50k+</div>
              <div className="mt-2 text-gray-600 dark:text-gray-300">Colis livrés</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-sky-600 dark:text-sky-400">15k+</div>
              <div className="mt-2 text-gray-600 dark:text-gray-300">Utilisateurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-sky-600 dark:text-sky-400">500+</div>
              <div className="mt-2 text-gray-600 dark:text-gray-300">Villes desservies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-sky-600 dark:text-sky-400">98%</div>
              <div className="mt-2 text-gray-600 dark:text-gray-300">Satisfaction client</div>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="px-6 py-16 md:px-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 md:text-4xl dark:text-white">
            Ce que disent nos utilisateurs
          </h2>
          
          <div className="grid gap-8 mt-12 md:grid-cols-3">
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5" fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "Service excellent ! J'ai économisé 60% sur l'envoi de mes colis et tout s'est parfaitement déroulé."
              </p>
              <div className="mt-4">
                <div className="font-semibold text-gray-900 dark:text-white">Marie L.</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Particulier</div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5" fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "En tant que transporteur, ecodeli me permet d'optimiser mes trajets et d'avoir un revenu complémentaire."
              </p>
              <div className="mt-4">
                <div className="font-semibold text-gray-900 dark:text-white">Thomas B.</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Transporteur</div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5" fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "Interface simple et intuitive. Le suivi en temps réel est un vrai plus pour rassurer mes clients."
              </p>
              <div className="mt-4">
                <div className="font-semibold text-gray-900 dark:text-white">Sophie M.</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">E-commerçante</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-sky-600 dark:bg-sky-700 md:px-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Prêt à révolutionner vos livraisons ?
          </h2>
          <p className="mt-4 text-xl text-sky-100">
            Rejoignez des milliers d'utilisateurs qui font confiance à ecodeli
          </p>
          <div className="flex flex-col justify-center gap-4 mt-8 sm:flex-row">
            <Link href="/register" className="px-8 py-3 font-medium transition bg-white rounded-full text-sky-600 hover:bg-gray-100">
              Créer un compte
            </Link>
            <Link href="/exp" className="px-8 py-3 font-medium text-white transition border-2 border-white rounded-full hover:bg-white hover:text-sky-600">
              Envoyer mon premier colis
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 py-12 bg-gray-900 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Logo et description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image 
                  src="/LOGO_.png"
                  alt="Logo Ecodeli"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span className="text-2xl font-bold text-white">ecodeli</span>
              </div>
              <p className="text-gray-400">
                Livraison facile, écolo et moins chère. Envoyez vos colis partout en France 
                en profitant de trajets déjà planifiés.
              </p>
            </div>

            {/* Liens rapides */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Liens rapides</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/exp" className="hover:text-white">Expédier un colis</Link></li>
                <li><Link href="/trajet" className="hover:text-white">Voir les trajets</Link></li>
                <li><Link href="/register" className="hover:text-white">Devenir transporteur</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Mon compte</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Centre d'aide</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
                <li><Link href="#" className="hover:text-white">Conditions d'utilisation</Link></li>
                <li><Link href="#" className="hover:text-white">Politique de confidentialité</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-gray-800">
            <div className="flex flex-col items-center justify-between md:flex-row">
              <p className="text-gray-400">
                © 2025 ecodeli. Tous droits réservés.
              </p>
              <div className="flex gap-4 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 