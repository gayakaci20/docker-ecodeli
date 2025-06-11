import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react' // Importer useState et useEffect
import { useRouter } from 'next/router' // Importer useRouter pour la redirection
import { useAuth } from '../contexts/AuthContext' // Importer le contexte d'authentification
import { Sun, Moon } from 'lucide-react'

export default function Login({ isDarkMode, toggleDarkMode }) {
  const router = useRouter(); // Initialiser useRouter
  const { user, loading, login } = useAuth(); // Utiliser le contexte d'authentification
  
  // États pour les champs du formulaire
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    if (user) {
      // Rediriger selon le rôle de l'utilisateur
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        const callbackUrl = router.query.callbackUrl || '/profile';
        router.push(callbackUrl);
      }
    }
  }, [user, router]);

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Utiliser la fonction login du contexte d'authentification
      const result = await login(formData.email, formData.password);
      
      if (!result.success) {
        throw new Error(result.error || 'Une erreur est survenue lors de la connexion.');
      }

      // Connexion réussie
      console.log('Connexion réussie:', result.user);
      
      // Rediriger selon le rôle de l'utilisateur
      if (result.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        // Récupérer l'URL de callback si elle existe
        const callbackUrl = router.query.callbackUrl || '/profile';
        // Rediriger vers la page de profil ou la page demandée
        router.push(callbackUrl);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <Head>
        <title>Connexion - ecodeli</title>
        <meta name="description" content="Connectez-vous à votre compte ecodeli" />
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
          Bienvenue chez ecodeli !
        </h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-300">
          Connectez-vous ou inscrivez-vous.
        </p>

        {/* Affichage des erreurs */}
        {error && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form className="space-y-6" onSubmit={handleSubmit}> {/* Ajouter onSubmit */} 
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
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="block w-full px-3 py-2 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end">
            <Link 
              href="/forgot-password"
              className="text-sm text-sky-400 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
            >
              Mot de passe oublié
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading} // Désactiver pendant le chargement
            className="flex justify-center w-full px-4 py-3 text-sm font-medium text-white transition-colors border border-transparent rounded-full shadow-sm bg-sky-400 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connexion en cours...' : 'Me connecter'}
          </button>

          <div className="text-center">
            <Link 
              href="/register"
              className="text-sm text-sky-400 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
            >
              S'inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}