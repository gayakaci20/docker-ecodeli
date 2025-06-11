import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import GoogleMapWebComponent from '../components/GoogleMapWebComponent'
import Header from '../components/Header'
import { MapPin, PlusCircle, ArrowUpDown, Filter, Trash2, ImageIcon } from 'lucide-react'

// --- Icônes remplacées par Lucide React ---
const LocationPinIcon = () => (
  <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
)

const PlusCircleIcon = () => (
  <PlusCircle className="w-5 h-5 mr-1 text-sky-500 dark:text-sky-400" />
)

const SwapVerticalIcon = () => (
  <ArrowUpDown className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
)

const FilterIcon = () => (
  <Filter className="w-4 h-4 mr-1" />
)

const TrashIcon = () => (
  <Trash2 className="w-4 h-4 text-red-500" />
)

export default function Trajet({ isDarkMode, toggleDarkMode }) {
  // Search settings
  const [searchType, setSearchType] = useState('my-trip')
  const [departureCity, setDepartureCity] = useState('')
  const [arrivalCity, setArrivalCity] = useState('')
  const [intermediateStops, setIntermediateStops] = useState([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Route tracking
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [routeCoordinates, setRouteCoordinates] = useState(null)
  
  // Data states
  const [allPackages, setAllPackages] = useState([])
  const [filteredPackages, setFilteredPackages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all packages on component mount
  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/packages');
        if (!response.ok) {
          throw new Error('Failed to fetch packages');
        }
        const data = await response.json();
        console.log('Data from /api/packages in trajet.jsx:', JSON.stringify(data, null, 2));
        
        let packagesData = [];
        if (Array.isArray(data)) {
          packagesData = data;
          console.log('Packages set in trajet.jsx (from array):', JSON.stringify(data, null, 2));
        } else if (data.packages && Array.isArray(data.packages)) {
          packagesData = data.packages;
          console.log('Packages set in trajet.jsx (from data.packages):', JSON.stringify(data.packages, null, 2));
        } else {
          // Create a mock package for testing if no data is available
          packagesData = [{
            id: 'sample1',
            title: 'Échantillon de colis',
            pickupAddress: 'Paris, France',
            deliveryAddress: 'Lyon, France',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            weight: 5
          }];
        }
        
        setAllPackages(packagesData);
        setFilteredPackages(packagesData); // Initially show all packages
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // Function to swap departure and arrival cities
  const swapCities = () => {
    setDepartureCity(arrivalCity);
    setArrivalCity(departureCity);
  };

  // Function to add an intermediate stop
  const addIntermediateStop = () => {
    setIntermediateStops([...intermediateStops, '']);
  };

  // Function to update an intermediate stop
  const updateIntermediateStop = (index, value) => {
    const updatedStops = [...intermediateStops];
    updatedStops[index] = value;
    setIntermediateStops(updatedStops);
  };

  // Function to remove an intermediate stop
  const removeIntermediateStop = (index) => {
    const updatedStops = intermediateStops.filter((_, i) => i !== index);
    setIntermediateStops(updatedStops);
  };

  // Filter packages based on search criteria
  const filterPackages = useCallback(() => {
    if (!departureCity && !arrivalCity && searchType === 'around') {
      // If using 'around' mode but no city specified, show all packages
      setFilteredPackages(allPackages);
      return;
    }

    // Helper function to check if a location matches search terms
    const locationMatches = (address, searchTerm) => {
      if (!searchTerm) return true; // If no search term, consider it a match
      return address.toLowerCase().includes(searchTerm.toLowerCase());
    };

    // Filter based on search type
    let filtered = [];
    if (searchType === 'around') {
      // For 'around' mode, match packages with pickup or delivery near the specified city
      const searchCity = departureCity || arrivalCity;
      filtered = allPackages.filter(pkg => 
        locationMatches(pkg.pickupAddress, searchCity) || 
        locationMatches(pkg.deliveryAddress, searchCity)
      );
    } else {
      // For 'my-trip' mode, match packages along the route
      // A package is considered "along the route" if:
      // - Its pickup location matches departure or an intermediate stop
      // - Its delivery location matches arrival or an intermediate stop
      filtered = allPackages.filter(pkg => {
        // All locations to check (departure, intermediate stops, arrival)
        const routeLocations = [
          departureCity, 
          ...intermediateStops, 
          arrivalCity
        ].filter(Boolean); // Remove empty values
        
        if (routeLocations.length === 0) return true; // If no locations specified, show all
        
        // Check if pickup or delivery matches any location in the route
        const pickupMatchesRoute = routeLocations.some(loc => 
          locationMatches(pkg.pickupAddress, loc)
        );
        
        const deliveryMatchesRoute = routeLocations.some(loc => 
          locationMatches(pkg.deliveryAddress, loc)
        );
        
        return pickupMatchesRoute || deliveryMatchesRoute;
      });
    }

    setFilteredPackages(filtered);
  }, [allPackages, searchType, departureCity, arrivalCity, intermediateStops]);

  // Update filtered packages when search criteria change
  useEffect(() => {
    filterPackages();
  }, [filterPackages]);

  // Update route coordinates when route changes
  useEffect(() => {
    if (departureCity && arrivalCity) {
      setRouteCoordinates({
        origin: departureCity,
        destination: arrivalCity,
        waypoints: intermediateStops.filter(Boolean).map(stop => ({ location: stop }))
      });
    } else {
      setRouteCoordinates(null);
    }
  }, [departureCity, arrivalCity, intermediateStops]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-gray-900">
      <Head>
        <title>Trouver un trajet - ecodeli</title>
        <meta name="description" content="Transportez des colis sur votre trajet ou autour de vous" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main Layout (Sidebar + Map) */}
      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar Gauche */}
        <aside className="flex flex-col w-full h-full overflow-y-auto bg-white border-r border-gray-200 md:w-1/3 lg:w-1/4 dark:bg-gray-900 dark:border-gray-700">
          {/* Sticky Header Part of Sidebar */}
          <div className="sticky top-0 z-10 flex-shrink-0 p-4 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
            <h1 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Transportez des colis sur votre trajet
            </h1>
            {/* Radio buttons and inputs */}
            <div className="flex items-center mb-4 space-x-4">
              <label className="block mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
                 <input 
                   type="radio" 
                   name="searchType" 
                   value="around" 
                   checked={searchType === 'around'} 
                   onChange={() => setSearchType('around')} 
                   className="w-4 h-4 mr-2 border-gray-300 focus:ring-sky-500 text-sky-600 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-sky-500"
                 />
                 Autour de
               </label>
                <label className="block mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
                 <input 
                   type="radio" 
                   name="searchType" 
                   value="my-trip" 
                   checked={searchType === 'my-trip'} 
                   onChange={() => setSearchType('my-trip')} 
                   className="w-4 h-4 mr-2 border-gray-300 focus:ring-sky-500 text-sky-600 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-sky-500"
                 />
                 Sur mon trajet
               </label>
            </div>
            
            {/* Departure city input */}
            <div className="relative mb-2">
               <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                 <LocationPinIcon />
               </div>
               <input 
                 type="text" 
                 placeholder="Ville de départ" 
                 value={departureCity}
                 onChange={(e) => setDepartureCity(e.target.value)}
                 className="w-full py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:text-gray-100 dark:placeholder-gray-500"
               />
            </div>
            
            {/* Intermediate stops */}
            {intermediateStops.map((stop, index) => (
              <div key={`stop-${index}`} className="relative mb-2">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LocationPinIcon />
                </div>
                <input 
                  type="text" 
                  placeholder={`Étape ${index + 1}`}
                  value={stop}
                  onChange={(e) => updateIntermediateStop(index, e.target.value)}
                  className="w-full py-2 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:text-gray-100 dark:placeholder-gray-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button 
                    onClick={() => removeIntermediateStop(index)}
                    className="focus:outline-none"
                    aria-label="Supprimer cette étape"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Arrival city input */}
            <div className="relative mb-3">
               <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                 <LocationPinIcon />
               </div>
               <input 
                 type="text" 
                 placeholder="Ville d'arrivée"
                 value={arrivalCity}
                 onChange={(e) => setArrivalCity(e.target.value)}
                 className="w-full py-2 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:text-gray-100 dark:placeholder-gray-500"
               />
               <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                 <button 
                   onClick={swapCities}
                   className="focus:outline-none"
                   aria-label="Inverser les villes de départ et d'arrivée"
                 >
                   <SwapVerticalIcon />
                 </button>
               </div>
            </div>
            
            {/* Add stop button */}
            <button 
              onClick={addIntermediateStop}
              className="flex items-center text-sm text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 focus:outline-none"
            >
               <PlusCircleIcon /> Ajouter une étape
            </button>
          </div>

          {/* Scrollable Trip List */}
          <div className="flex-grow p-4 space-y-4 overflow-y-auto">
            {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Chargement des colis...</p>}
            {error && <p className="text-center text-red-500 dark:text-red-400">Erreur: {error}</p>}
            {!isLoading && !error && filteredPackages.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">Aucun colis trouvé pour cette recherche.</p>
            )}
            {!isLoading && !error && filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex overflow-hidden transition border border-gray-200 rounded-lg shadow-sm cursor-pointer bg-gray-50 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md"
                onClick={() => setSelectedRoute({
                  pickup: pkg.pickupAddress,
                  delivery: pkg.deliveryAddress,
                  id: pkg.id
                })}
              >
                <div className="relative flex-shrink-0 w-1/4 aspect-square">
                  {pkg.imageUrl ? (
                    <Image 
                      src={pkg.imageUrl} 
                      alt={`Image pour ${pkg.title}`} 
                      layout="fill"
                      objectFit="cover"
                      className="bg-gray-200 dark:bg-gray-700"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700">
                      <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between flex-grow p-3">
                  <div>
                     <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{pkg.title}</h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mb-0.5">
                       <LocationPinIcon /> <span className="ml-1 truncate">{pkg.pickupAddress}</span>
                     </p>
                     <p className="flex items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
                       <LocationPinIcon /> <span className="ml-1 truncate">{pkg.deliveryAddress}</span>
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">
                       Créé le: {new Date(pkg.createdAt).toLocaleDateString()}
                     </p>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                     <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                       {pkg.weight ? `${pkg.weight} kg` : (pkg.dimensions || 'N/A')}
                     </span>
                     <span className="text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">{pkg.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky Filters Button */}
          <div className="sticky bottom-0 z-10 flex justify-center flex-shrink-0 p-4 mt-auto bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700">
            <button 
              onClick={filterPackages}
              className="flex items-center px-4 py-2 text-sm font-medium text-white transition rounded-full bg-sky-400 hover:bg-sky-500"
            >
              <FilterIcon /> Filtres
            </button>
          </div>
        </aside>

        {/* Map Droite - REMPLACÉ */}
        <main className="relative flex-grow h-full bg-gray-100 dark:bg-gray-800">
          {/* Le composant prend toute la place */}
          <GoogleMapWebComponent 
            selectedRoute={selectedRoute} 
            routeCoordinates={routeCoordinates}
            packages={filteredPackages}
            onPackageClick={(pkg) => setSelectedRoute({
              pickup: pkg.pickupAddress,
              delivery: pkg.deliveryAddress,
              id: pkg.id
            })}
          />
        </main>
      </div>
    </div>
  )
}
