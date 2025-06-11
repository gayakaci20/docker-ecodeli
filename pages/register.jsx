import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react' // Importer useState
import { useRouter } from 'next/router' // Importer useRouter pour la redirection
import { Sun, Moon } from 'lucide-react'

export default function Register({ isDarkMode, toggleDarkMode }) {
  const router = useRouter(); // Initialiser useRouter
  // États pour les champs du formulaire
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'INDIVIDUAL', // INDIVIDUAL ou PROFESSIONAL 
    role: 'SENDER', // SENDER ou CARRIER
    // Champs pour les professionnels
    companyName: '',
    companyFirstName: '',
    companyLastName: '',
    terms: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation simple côté client
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setIsLoading(false);
      return;
    }
    if (!formData.terms) {
      setError('Vous devez accepter les conditions d\'utilisation.');
      setIsLoading(false);
      return;
    }
    // Validation conditionnelle selon le type d'utilisateur
    if (formData.userType === 'INDIVIDUAL') {
      if (!formData.firstName || !formData.lastName) {
        setError('Veuillez remplir le prénom et le nom.');
        setIsLoading(false);
        return;
      }
    } else if (formData.userType === 'PROFESSIONAL') {
      if (!formData.companyName || !formData.companyFirstName || !formData.companyLastName) {
        setError('Veuillez remplir tous les champs de la société.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          userType: formData.userType,
          role: formData.role,
          // Champs professionnels
          companyName: formData.companyName,
          companyFirstName: formData.companyFirstName,
          companyLastName: formData.companyLastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue lors de l\'inscription.');
      }

      // Inscription réussie, rediriger vers la page de connexion
      console.log('Inscription réussie:', data);
      router.push('/login'); // Redirection vers la page de connexion

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <Head>
        <title>Inscription - ecodeli</title>
        <meta name="description" content="Inscrivez-vous sur ecodeli" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        {/* Logo */}
        <div className="flex items-center justify-between mb-6">
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
        </div>

        {/* Titre */}
        <h1 className="mb-2 text-3xl font-bold text-center text-gray-900 dark:text-white">
          Créez votre compte
        </h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-300">
          Rejoignez ecodeli pour profiter de tous nos services.
        </p>

        {/* Affichage des erreurs */}
        {error && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form className="space-y-6" onSubmit={handleSubmit}> {/* Ajouter onSubmit */} 
          {/* Section Type d'utilisateur */}
          <div>
            <label className="block mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
              Je suis
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name="userType"
                    value="INDIVIDUAL"
                    checked={formData.userType === 'INDIVIDUAL'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.userType === 'INDIVIDUAL' 
                      ? 'border-sky-500 bg-sky-500' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}>
                    {formData.userType === 'INDIVIDUAL' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-base font-medium text-gray-900 dark:text-gray-300">Particulier</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name="userType"
                    value="PROFESSIONAL"
                    checked={formData.userType === 'PROFESSIONAL'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.userType === 'PROFESSIONAL' 
                      ? 'border-sky-500 bg-sky-500' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}>
                    {formData.userType === 'PROFESSIONAL' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-base font-medium text-gray-900 dark:text-gray-300">Professionnel</span>
              </label>
            </div>
          </div>

          {/* Section Profil */}
            <div>
            <label className="block mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
              Mon profil
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name="role"
                    value="SENDER"
                    checked={formData.role === 'SENDER'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.role === 'SENDER' 
                      ? 'border-sky-500 bg-sky-500' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}>
                    {formData.role === 'SENDER' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-base font-medium text-gray-900 dark:text-gray-300">Expéditeur</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name="role"
                    value="CARRIER"
                    checked={formData.role === 'CARRIER'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.role === 'CARRIER' 
                      ? 'border-sky-500 bg-sky-500' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}>
                    {formData.role === 'CARRIER' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-base font-medium text-gray-900 dark:text-gray-300">Transporteur</span>
              </label>
            </div>
          </div>

          {/* Champs Prénom et Nom - Affichés seulement pour les particuliers */}
          {formData.userType === 'INDIVIDUAL' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                Prénom
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={formData.firstName} // Lier la valeur à l'état
                onChange={handleChange} // Gérer les changements
                  className="block w-full px-3 py-2 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
                <label htmlFor="lastName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                Nom
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={formData.lastName} // Lier la valeur à l'état
                onChange={handleChange} // Gérer les changements
                  className="block w-full px-3 py-2 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          )}

          {/* Section Informations société - Affichée seulement pour les professionnels */}
          {formData.userType === 'PROFESSIONAL' && (
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
                Informations société
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="companyName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Raison sociale
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Ex : Legris SARL"
                    required={formData.userType === 'PROFESSIONAL'}
                    value={formData.companyName}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-600">
                  <h4 className="mb-3 text-base font-medium text-gray-700 dark:text-gray-200">
                    Dirigeant(e) de la société
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="companyFirstName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                        Prénom
                      </label>
                      <input
                        id="companyFirstName"
                        name="companyFirstName"
                        type="text"
                        required={formData.userType === 'PROFESSIONAL'}
                        value={formData.companyFirstName}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="companyLastName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                        Nom
                      </label>
                      <input
                        id="companyLastName"
                        name="companyLastName"
                        type="text"
                        required={formData.userType === 'PROFESSIONAL'}
                        value={formData.companyLastName}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="block w-full px-3 py-2 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Téléphone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              // required // Le téléphone est optionnel dans le schéma Prisma
              value={formData.phone} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="block w-full px-3 py-2 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="block w-full px-3 py-2 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="block w-full px-3 py-2 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              checked={formData.terms} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="w-4 h-4 border-gray-300 rounded text-sky-500 focus:ring-sky-500 dark:border-gray-600"
            />
            <label htmlFor="terms" className="block ml-2 text-sm text-gray-700 dark:text-gray-200">
              J'accepte les{' '}
              <Link href="/terms" className="text-sky-400 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
                conditions d'utilisation
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading} // Désactiver pendant le chargement
            className="flex justify-center w-full px-4 py-3 text-sm font-medium text-white transition-colors border border-transparent rounded-full shadow-sm bg-sky-400 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Création en cours...' : 'Créer mon compte'}
          </button>

          <div className="text-sm text-center text-gray-600 dark:text-gray-300">
            Déjà inscrit ?{' '}
            <Link 
              href="/login"
              className="font-medium text-sky-400 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
            >
              Me connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}