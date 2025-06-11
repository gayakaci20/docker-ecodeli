import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  SparklesIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  HomeIcon,
  CogIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  StarIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X,
  Twitter,
  Facebook,
  Instagram
} from 'lucide-react';

// Icônes pour chaque catégorie de service
const categoryIcons = {
  CLEANING: SparklesIcon,
  MAINTENANCE: WrenchScrewdriverIcon,
  DELIVERY: TruckIcon,
  INSTALLATION: CogIcon,
  REPAIR: WrenchScrewdriverIcon,
  CONSULTATION: ChatBubbleLeftRightIcon,
  OTHER: HomeIcon
};

// Descriptions des catégories de services
const categoryDescriptions = {
  CLEANING: {
    title: 'Nettoyage',
    description: 'Services de nettoyage professionnels pour votre domicile et bureaux',
    features: ['Nettoyage à domicile', 'Entretien bureaux', 'Nettoyage après travaux', 'Services écologiques']
  },
  MAINTENANCE: {
    title: 'Maintenance',
    description: 'Entretien et maintenance préventive de vos équipements',
    features: ['Maintenance préventive', 'Entretien jardins', 'Maintenance équipements', 'Inspections régulières']
  },
  DELIVERY: {
    title: 'Livraison',
    description: 'Services de livraison rapides et fiables dans toute la région',
    features: ['Livraison express', 'Transport de colis', 'Livraison programmée', 'Suivi en temps réel']
  },
  INSTALLATION: {
    title: 'Installation',
    description: 'Installation professionnelle de vos équipements et mobiliers',
    features: ['Installation mobilier', 'Montage équipements', 'Configuration systèmes', 'Mise en service']
  },
  REPAIR: {
    title: 'Réparation',
    description: 'Réparations expertes pour tous types d\'équipements',
    features: ['Réparation électroménager', 'Dépannage urgent', 'Réparation vélos', 'Maintenance corrective']
  },
  CONSULTATION: {
    title: 'Consultation',
    description: 'Conseils d\'experts pour vos projets personnels et professionnels',
    features: ['Conseils personnalisés', 'Audit énergétique', 'Consultation technique', 'Expertise métier']
  },
  OTHER: {
    title: 'Autres services',
    description: 'Services variés pour répondre à tous vos besoins spécifiques',
    features: ['Services sur mesure', 'Prestations spécialisées', 'Solutions personnalisées', 'Accompagnement projet']
  }
};

export default function Solutions({ isDarkMode, toggleDarkMode }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [stats, setStats] = useState({
    totalServices: 0,
    totalProviders: 0,
    averageRating: 0
  });
  const { user, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    fetchServices();
    fetchStats();
  }, [selectedCategory]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Temporary mock data until we fix the database schema
      const mockServices = [
        {
          id: '1',
          name: 'Nettoyage à domicile',
          description: 'Service de nettoyage professionnel pour votre domicile',
          category: 'CLEANING',
          price: 25.00,
          duration: 120,
          location: 'Paris et banlieue',
          averageRating: 4.8,
          reviewCount: 15,
          providerId: 'provider1',
          provider: {
            firstName: 'Marie',
            lastName: 'Dupont',
            isVerified: true
          }
        },
        {
          id: '2',
          name: 'Réparation vélo',
          description: 'Réparation et entretien de vélos',
          category: 'MAINTENANCE',
          price: 35.00,
          duration: 90,
          location: 'Paris 11ème',
          averageRating: 4.6,
          reviewCount: 8,
          providerId: 'provider2',
          provider: {
            firstName: 'Pierre',
            lastName: 'Martin',
            isVerified: true
          }
        },
        {
          id: '3',
          name: 'Livraison express',
          description: 'Livraison de colis en moins de 2h',
          category: 'DELIVERY',
          price: 15.00,
          duration: 60,
          location: 'Paris intra-muros',
          averageRating: 4.9,
          reviewCount: 23,
          providerId: 'provider3',
          provider: {
            firstName: 'Sophie',
            lastName: 'Bernard',
            isVerified: true
          }
        },
        {
          id: '4',
          name: 'Installation mobilier',
          description: 'Montage et installation de meubles',
          category: 'INSTALLATION',
          price: 45.00,
          duration: 180,
          location: 'Île-de-France',
          averageRating: 4.7,
          reviewCount: 12,
          providerId: 'provider4',
          provider: {
            firstName: 'Thomas',
            lastName: 'Leroy',
            isVerified: true
          }
        },
        {
          id: '5',
          name: 'Réparation électroménager',
          description: 'Dépannage et réparation d\'électroménager',
          category: 'REPAIR',
          price: 55.00,
          duration: 120,
          location: 'Paris et proche banlieue',
          averageRating: 4.5,
          reviewCount: 18,
          providerId: 'provider5',
          provider: {
            firstName: 'Julie',
            lastName: 'Martinez',
            isVerified: true
          }
        },
        {
          id: '6',
          name: 'Consultation en rénovation',
          description: 'Conseils pour vos projets de rénovation',
          category: 'CONSULTATION',
          price: 75.00,
          duration: 90,
          location: 'Visioconférence ou domicile',
          averageRating: 4.9,
          reviewCount: 7,
          providerId: 'provider6',
          provider: {
            firstName: 'Vincent',
            lastName: 'Durand',
            isVerified: true
          }
        }
      ];

      // Filter by category if selected
      let filteredServices = mockServices;
      if (selectedCategory !== 'all') {
        filteredServices = mockServices.filter(service => service.category === selectedCategory);
      }

      setServices(filteredServices);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats for now
      setStats({
        totalServices: 6,
        totalProviders: 6,
        averageRating: 4.7
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const categories = Object.keys(categoryDescriptions);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Nos Solutions - ecodeli</title>
        <meta name="description" content="Découvrez tous les services proposés par ecodeli : nettoyage, maintenance, livraison, installation et bien plus encore." />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Header - même style que index.jsx */}
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
          <Link href="/" className="hover:text-sky-500 dark:hover:text-sky-400">Accueil</Link>
          <Link href="/exp" className="hover:text-sky-500 dark:hover:text-sky-400">Expédier un colis</Link>
          <Link href="/trajet" className="hover:text-sky-500 dark:hover:text-sky-400">Voir les trajets</Link>
          <Link href="/solutions" className="font-semibold text-sky-500 dark:text-sky-400">Nos solutions</Link>
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
          
          {!authLoading && (
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
          {authLoading && (
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
            <Link href="/" className="py-2 text-gray-800 dark:text-white hover:text-sky-500 dark:hover:text-sky-400">Accueil</Link>
            <Link href="/exp" className="py-2 text-gray-800 dark:text-white hover:text-sky-500 dark:hover:text-sky-400">Expédier un colis</Link>
            <Link href="/trajet" className="py-2 text-gray-800 dark:text-white hover:text-sky-500 dark:hover:text-sky-400">Voir les trajets</Link>
            <Link href="/solutions" className="py-2 font-semibold text-sky-500 dark:text-sky-400">Nos solutions</Link>
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
              
              {!authLoading && (
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
               {authLoading && (
                 <div className="bg-sky-400 rounded-full w-[60px] h-[40px] animate-pulse"></div>
               )}
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-12 md:px-20 md:py-20">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-6xl dark:text-white">
              Nos <span className="text-sky-400">Solutions</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
              Découvrez notre gamme complète de services pour particuliers et professionnels. 
              Des solutions écologiques et locales pour tous vos besoins quotidiens.
            </p>
            
            {/* Stats */}
            <div className="grid gap-8 mt-12 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800"
              >
                <div className="text-4xl font-bold text-sky-400 dark:text-sky-400">{stats.totalServices}</div>
                <div className="mt-2 text-gray-600 dark:text-gray-300">Services disponibles</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800"
              >
                <div className="text-4xl font-bold text-sky-400 dark:text-sky-400">{stats.totalProviders}</div>
                <div className="mt-2 text-gray-600 dark:text-gray-300">Prestataires actifs</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800"
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-4xl font-bold text-sky-400 dark:text-sky-400">{stats.averageRating.toFixed(1)}</div>
                  <StarIcon className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="mt-2 text-gray-600 dark:text-gray-300">Note moyenne</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Categories Filter */}
      <section className="px-6 py-8 bg-gray-50 dark:bg-gray-800 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-sky-400 text-white shadow-lg hover:bg-sky-500'
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow-md dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Tous les services
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-sky-400 text-white shadow-lg hover:bg-sky-500'
                    : 'bg-white text-gray-600 hover:bg-gray-100 shadow-md dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {categoryDescriptions[category].title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid or Services List */}
      <section className="px-6 py-16 md:px-20">
        <div className="max-w-6xl mx-auto">
          {selectedCategory === 'all' ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => {
                const IconComponent = categoryIcons[category];
                const categoryInfo = categoryDescriptions[category];
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 transition-shadow duration-300 bg-white rounded-lg shadow-sm cursor-pointer dark:bg-gray-800 hover:shadow-lg group"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div className="flex items-center mb-4">
                      <div className="flex items-center justify-center w-12 h-12 transition-colors rounded-lg bg-sky-100 dark:bg-sky-900 group-hover:bg-sky-200 dark:group-hover:bg-sky-800">
                        <IconComponent className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                      </div>
                      <h3 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
                        {categoryInfo.title}
                      </h3>
                    </div>
                    
                    <p className="mb-4 text-gray-600 dark:text-gray-300">
                      {categoryInfo.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {categoryInfo.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <CheckCircleIcon className="flex-shrink-0 w-4 h-4 mr-2 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-4 font-medium text-sky-400 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300">
                      Voir les services →
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Services List for Selected Category
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8 text-center"
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
                  {categoryDescriptions[selectedCategory].title}
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                  {categoryDescriptions[selectedCategory].description}
                </p>
              </motion.div>

              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                      <div className="animate-pulse">
                        <div className="w-3/4 h-4 mb-4 bg-gray-200 rounded dark:bg-gray-700"></div>
                        <div className="w-full h-3 mb-2 bg-gray-200 rounded dark:bg-gray-700"></div>
                        <div className="w-2/3 h-3 bg-gray-200 rounded dark:bg-gray-700"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : services.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {services.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 transition-shadow duration-300 bg-white rounded-lg shadow-sm dark:bg-gray-800 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {service.name}
                        </h3>
                        {service.averageRating > 0 && (
                          <div className="flex items-center ml-2">
                            <StarIcon className="w-4 h-4 text-yellow-400" />
                            <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                              {service.averageRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                        {service.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4 text-sm text-gray-500 dark:text-gray-400">
                        {service.location && (
                          <div className="flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            {service.location}
                          </div>
                        )}
                        {service.duration && (
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {service.duration} min
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-sky-400 dark:text-sky-400">
                          {service.price}€
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Par {service.provider.firstName} {service.provider.lastName}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mb-4 text-gray-400">
                    <SparklesIcon className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                    Aucun service trouvé
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun service n'est disponible dans cette catégorie pour le moment.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-sky-600 dark:bg-sky-700 md:px-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Rejoignez notre communauté
            </h2>
            <p className="mt-4 text-xl text-sky-400">
              Proposez vos services ou trouvez le prestataire idéal près de chez vous
            </p>
            <div className="flex flex-col justify-center gap-4 mt-8 sm:flex-row">
              <Link href="/register" className="px-8 py-3 font-medium transition bg-white rounded-full text-sky-600 hover:bg-gray-100">
                Devenir prestataire
              </Link>
              <Link href="/services" className="px-8 py-3 font-medium text-white transition border-2 border-white rounded-full hover:bg-white hover:text-sky-600">
                Trouver un service
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - même style que index.jsx */}
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
                <li><Link href="/solutions" className="hover:text-white">Nos solutions</Link></li>
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
  );
} 