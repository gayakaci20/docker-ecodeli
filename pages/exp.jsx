import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext' // Import useAuth hook
import { Camera, ChevronRight, Calculator } from 'lucide-react'


// Helper function to skip file upload during testing
const isDev = process.env.NODE_ENV === 'development';
const SKIP_REAL_UPLOAD = false; // Désactivé pour permettre le téléchargement réel des fichiers

// Icônes remplacées par Lucide React
const CameraIcon = () => (
  <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500" />
)

const ArrowRightIcon = () => (
  <ChevronRight className="w-5 h-5 ml-1" />
)

const CalculatorIcon = () => (
  <Calculator className="w-5 h-5" />
)

export default function Exp({ isDarkMode, toggleDarkMode }) {
  const router = useRouter()
  const { user, loading } = useAuth() // Get authentication state
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Form State
  const [photos, setPhotos] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [objectName, setObjectName] = useState('')
  const [knowDimensions, setKnowDimensions] = useState(false)
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [format, setFormat] = useState('')
  const [weight, setWeight] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // --- Add State for Addresses --- 
  const [pickupAddress, setPickupAddress] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')

  // --- Add State for Price Calculation ---
  const [calculatedPrice, setCalculatedPrice] = useState(null)
  const [priceDetails, setPriceDetails] = useState(null)
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false)
  const [priceError, setPriceError] = useState('')

  // Check if user is authenticated and redirect if not
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login page with a callback URL to return here after login
      router.push(`/login?callbackUrl=${encodeURIComponent('/exp')}`);
    }
  }, [user, loading, router]);

  // Fonction pour calculer le prix automatiquement
  const calculatePrice = async () => {
    if (!pickupAddress || !deliveryAddress) {
      setCalculatedPrice(null);
      setPriceDetails(null);
      return;
    }

    setIsCalculatingPrice(true);
    setPriceError('');

    try {
      const dimensions = knowDimensions && length && width && height ? `${length}x${width}x${height}` : null;
      
      const response = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickupAddress,
          deliveryAddress,
          weight: weight ? parseFloat(weight) : undefined,
          dimensions
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCalculatedPrice(data.price);
        setPriceDetails(data.details);
      } else {
        const errorData = await response.json();
        setPriceError(errorData.error || 'Erreur lors du calcul du prix');
      }
    } catch (error) {
      console.error('Erreur lors du calcul du prix:', error);
      setPriceError('Erreur lors du calcul du prix');
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  // Calculer le prix automatiquement quand les paramètres changent
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculatePrice();
    }, 1000); // Délai de 1 seconde pour éviter trop d'appels API

    return () => clearTimeout(timeoutId);
  }, [pickupAddress, deliveryAddress, weight, length, width, height, knowDimensions]);

  // If still loading auth state or redirecting, show loading state
  if (loading || (!loading && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 rounded-full border-sky-400 border-t-transparent animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  const handlePhotoChange = (e) => {
    if (e.target.files) {
      setPhotos(e.target.files); // Store the FileList
      console.log("Selected files:", e.target.files);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!objectName || !pickupAddress || !deliveryAddress) {
      setError('Veuillez remplir tous les champs obligatoires (Objet, Adresses).');
      setIsLoading(false);
      return;
    }

    let imageUrl = null;
    
    // Upload photo if selected - Using try/catch for each API call separately
    if (photos && photos.length > 0) {
      try {
        console.log('Preparing photo upload...');
        
        // Skip actual upload in development for testing
        if (SKIP_REAL_UPLOAD) {
          console.log('Skipping real upload in development mode');
          imageUrl = `/uploads/mock-dev-image-${Date.now()}.jpg`;
        } else {
          const formData = new FormData();
          formData.append('photo', photos[0]);
          
          const uploadRes = await fetch('/api/upload', { 
            method: 'POST', 
            body: formData 
          });
          
          // Gestion améliorée de la réponse
          if (uploadRes.ok) {
            const uploadResult = await uploadRes.json();
            imageUrl = uploadResult.url;
            console.log('Upload réussi, URL de l\'image:', imageUrl);
          } else {
            // Récupérer les détails de l'erreur si disponibles
            let errorDetails = '';
            try {
              const errorData = await uploadRes.json();
              errorDetails = errorData.message || errorData.error || '';
            } catch (e) {
              // Si on ne peut pas analyser la réponse JSON
              console.error('Impossible d\'analyser la réponse d\'erreur:', e);
            }
            console.error(`Échec de l'upload avec statut: ${uploadRes.status}`, errorDetails);
            throw new Error(`Échec de l'upload: ${errorDetails || 'Erreur serveur'}`);
          }
        }
      } catch (uploadErr) {
        console.error("Upload Error:", uploadErr);
        setError(`Erreur d'upload: ${uploadErr.message || 'Erreur inconnue'}`);
        setIsLoading(false);
        return;
      }
    }

    // Prepare data for package creation
    console.log('Preparing package data...');
    const dimensions = knowDimensions && length && width && height ? `${length}x${width}x${height}` : null;

    // Create package record
    try {
      console.log('User data from auth context:', user); // Debug user object
      console.log('Submitting package data...');
      
      // Check for a valid user session before proceeding
      const checkUser = async () => {
        try {
          const userResponse = await fetch('/api/auth/me');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData && userData.id && !userData.id.startsWith('user_')) {
              console.log('Valid user ID confirmed:', userData.id);
              return userData.id;
            } else {
              console.warn('Auth API returned invalid user ID format:', userData?.id);
            }
          } else {
            console.error('Failed to validate user session, status:', userResponse.status);
          }
          return null;
        } catch (err) {
          console.error('Error checking user session:', err);
          return null;
        }
      };
      
      // Get a fresh user ID - prioritize API call over context
      let userId = await checkUser();
      
      // Fall back to context only if it's a valid format
      if (!userId && user?.id && typeof user.id === 'string' && !user.id.startsWith('user_')) {
        userId = user.id;
        console.log('Using user ID from context:', userId);
      }
      
      if (!userId) {
        console.error('No valid user ID found!');
        setError('Erreur d\'authentification. Veuillez vous reconnecter.');
        setIsLoading(false);
        return;
      }
      
      const packageData = {
        userId,
        title: objectName,
        description: additionalInfo || null,
        quantity: parseInt(quantity, 10) || 1,
        weight: weight ? parseFloat(weight) : null,
        dimensions,
        pickupAddress,
        deliveryAddress,
        imageUrl,
      };
      
      console.log('Sending package data to API:', JSON.stringify(packageData, null, 2));
      const pkgRes = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData),
      });
      
      console.log('API response status:', pkgRes.status);
      
      // Check if the response is JSON
      const contentType = pkgRes.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const responseData = await pkgRes.json();
        
        if (pkgRes.ok) {
          console.log('Package created successfully:', responseData);
          router.push('/trajet');
        } else {
          // Handle structured error from API
          console.error('API returned error:', responseData);
          const errorMessage = responseData.details || responseData.error || 'Échec de création du colis';
          setError(errorMessage);
        }
      } else {
        // Handle non-JSON response (likely HTML error page)
        console.error('Received non-JSON response from API');
        const text = await pkgRes.text();
        console.error('Response text:', text.substring(0, 500) + '...'); // Log the start of the response
        setError(`Erreur serveur: Le serveur a retourné une réponse non valide (${pkgRes.status})`);
      }
    } catch (createErr) {
      console.error("Create Package Error:", createErr);
      setError(`Erreur création colis: ${createErr.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 bg-white dark:bg-gray-900 dark:text-gray-100">
      <Head>
        <title>Expédier un objet - ecodeli</title>
        <meta name="description" content="Décrivez l'objet que vous souhaitez expédier" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Replace the old header with the shared Header component */}
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main Content - Form */}
      <main className="p-4 md:p-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold md:text-4xl">
              Quels objets envoyez-vous ?
            </h1>
            <Link href="#" className="text-sm text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 whitespace-nowrap">
              Voir le guide photo
            </Link>
          </div>

          <div className="relative mb-6">
            <label htmlFor="photos" className="flex flex-col items-center justify-center p-8 text-center transition border-2 border-blue-300 border-dashed rounded-lg cursor-pointer dark:border-blue-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
              <CameraIcon />
              <span className="mt-2 text-lg font-medium text-gray-600 dark:text-gray-300">
                {photos ? `${photos.length} photo(s) sélectionnée(s)` : 'Ajouter des photos'}
              </span>
              <input 
                id="photos"
                name="photos"
                type="file"
                multiple 
                onChange={handlePhotoChange} 
                className="sr-only"
                accept="image/png, image/jpeg, image/gif"
              />
            </label>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Jusqu'à 7 photos, format JPG, PNG et GIF jusqu'à 7MB.
            </p>
            <div className="absolute hidden -right-5 -bottom-5 md:right-0 md:-bottom-2 sm:block">
              <Image src="/pin.png" alt="Mascot Pin" width={80} height={80} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <label htmlFor="quantity" className="block mb-1 text-sm font-medium">
                Quantité
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                required
                className="w-full p-2 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="objectName" className="block mb-1 text-sm font-medium">
                Objet
              </label>
              <input
                type="text"
                id="objectName"
                name="objectName"
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                placeholder="Ex : Canapé, fauteuil, scooter ..."
                required
                className="w-full p-2 placeholder-gray-400 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
            <div>
              <label htmlFor="pickupAddress" className="block mb-1 text-sm font-medium">Adresse de départ</label>
              <input 
                type="text" 
                id="pickupAddress" 
                value={pickupAddress} 
                onChange={(e) => setPickupAddress(e.target.value)} 
                required 
                placeholder="1 rue de l'exemple, 75001 Paris"
                className="w-full p-2 placeholder-gray-400 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label htmlFor="deliveryAddress" className="block mb-1 text-sm font-medium">Adresse d'arrivée</label>
              <input 
                type="text" 
                id="deliveryAddress" 
                value={deliveryAddress} 
                onChange={(e) => setDeliveryAddress(e.target.value)} 
                required 
                placeholder="10 avenue des exemples, 69001 Lyon"
                className="w-full p-2 placeholder-gray-400 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Prix calculé automatiquement */}
          {(calculatedPrice !== null || isCalculatingPrice || priceError) && (
            <div className="p-4 mb-6 border border-sky-200 rounded-lg bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800">
              <div className="flex items-center mb-2">
                <CalculatorIcon />
                <h3 className="ml-2 text-lg font-medium text-sky-800 dark:text-sky-200">
                  Prix estimé
                </h3>
              </div>
              
              {isCalculatingPrice && (
                <div className="flex items-center text-sky-600 dark:text-sky-300">
                  <div className="w-4 h-4 mr-2 border-2 rounded-full border-sky-400 border-t-transparent animate-spin"></div>
                  Calcul en cours...
                </div>
              )}
              
              {priceError && (
                <div className="text-red-600 dark:text-red-400">
                  {priceError}
                </div>
              )}
              
              {calculatedPrice !== null && !isCalculatingPrice && (
                <div>
                  <div className="text-2xl font-bold text-sky-800 dark:text-sky-200">
                    {calculatedPrice}€
                  </div>
                  {priceDetails && (
                    <div className="mt-2 text-sm text-sky-600 dark:text-sky-300">
                      <div>Distance: ~{priceDetails.distance} km</div>
                      <div>Poids: {priceDetails.weight} kg</div>
                      <div>Taille: {priceDetails.packageSize}</div>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-sky-500 dark:text-sky-400">
                    Prix calculé automatiquement selon la distance, le poids et la taille
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center mb-4">
            <button
              type="button"
              onClick={() => setKnowDimensions(!knowDimensions)}
              className={`${knowDimensions ? 'bg-sky-400' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-900 mr-3`}
              aria-pressed={knowDimensions}
            >
              <span className={`${knowDimensions ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
            </button>
            <span className="text-sm font-medium cursor-pointer" onClick={() => setKnowDimensions(!knowDimensions)}>
              Je connais les dimensions exactes (L x l x h)
            </span>
          </div>

          {knowDimensions && (
            <div className="grid grid-cols-1 gap-4 p-4 mb-6 border border-gray-200 rounded-lg sm:grid-cols-3 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div>
                <label htmlFor="length" className="block mb-1 text-xs font-medium">Longueur (cm)</label>
                <input type="number" id="length" value={length} onChange={e => setLength(e.target.value)} required className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
              </div>
              <div>
                 <label htmlFor="width" className="block mb-1 text-xs font-medium">Largeur (cm)</label>
                <input type="number" id="width" value={width} onChange={e => setWidth(e.target.value)} required className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
              </div>
               <div>
                 <label htmlFor="height" className="block mb-1 text-xs font-medium">Hauteur (cm)</label>
                <input type="number" id="height" value={height} onChange={e => setHeight(e.target.value)} required className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
            <div>
              <label htmlFor="weight" className="block mb-1 text-sm font-medium">
                Poids total estimé (kg)
              </label>
               <input 
                 type="number" 
                 id="weight" 
                 name="weight"
                 value={weight} 
                 onChange={(e) => setWeight(e.target.value)}
                 step="0.1" 
                 min="0"
                 placeholder="Ex: 15.5"
                 className="w-full p-2 placeholder-gray-400 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:placeholder-gray-500"
               />
            </div>
          </div>

          <div className="mb-8">
            <label htmlFor="additionalInfo" className="block mb-1 text-sm font-medium">
              Informations complémentaires (optionnel)
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              rows="4"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Ex : Le carton le plus long fait 2m15, le plus lourd est un canapé. Objets fragiles ? Besoin d'aide au chargement ?"
              className="w-full p-2 placeholder-gray-400 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:placeholder-gray-500"
            ></textarea>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Ces informations sont publiques. Ne partagez pas de données personnelles ici.
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded dark:bg-red-900 dark:text-red-200 dark:border-red-700">
              Erreur: {error}
            </div>
          )}

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center px-8 py-3 font-medium text-white transition rounded-full bg-sky-400 hover:bg-sky-500 disabled:bg-sky-400"
            >
              {isLoading ? 'Enregistrement...' : 'Suivant'}
              {!isLoading && <ArrowRightIcon />}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
