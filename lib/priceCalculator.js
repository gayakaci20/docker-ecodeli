/**
 * Calcule le prix d'un colis basé sur la distance, le poids et les dimensions
 */

// Tarifs de base
const PRICING_CONFIG = {
  // Prix de base par kilomètre
  BASE_PRICE_PER_KM: 0.5,
  
  // Prix minimum
  MINIMUM_PRICE: 5,
  
  // Prix par kg
  PRICE_PER_KG: 2,
  
  // Multiplicateurs par taille
  SIZE_MULTIPLIERS: {
    S: 1,      // Petit (jusqu'à 30x20x10 cm)
    M: 1.2,    // Moyen (jusqu'à 50x40x30 cm)
    L: 1.5,    // Grand (jusqu'à 80x60x50 cm)
    XL: 2,     // Très grand (jusqu'à 120x80x80 cm)
    XXL: 2.5,  // Énorme (jusqu'à 150x100x100 cm)
    XXXL: 3    // Gigantesque (plus de 150x100x100 cm)
  },
  
  // Seuils de dimensions en cm (L x l x h)
  SIZE_THRESHOLDS: {
    S: { maxVolume: 6000 },        // 30x20x10 = 6000 cm³
    M: { maxVolume: 60000 },       // 50x40x30 = 60000 cm³
    L: { maxVolume: 240000 },      // 80x60x50 = 240000 cm³
    XL: { maxVolume: 768000 },     // 120x80x80 = 768000 cm³
    XXL: { maxVolume: 1500000 },   // 150x100x100 = 1500000 cm³
    XXXL: { maxVolume: Infinity }  // Plus grand que XXL
  }
};

// Base de données simplifiée des distances entre grandes villes françaises
const CITY_DISTANCES = {
  'paris': {
    'lyon': 465,
    'marseille': 775,
    'toulouse': 680,
    'nice': 930,
    'nantes': 380,
    'strasbourg': 490,
    'montpellier': 750,
    'bordeaux': 580,
    'lille': 225,
    'rennes': 350,
    'reims': 145,
    'toulon': 835,
    'grenoble': 570,
    'dijon': 315,
    'angers': 295,
    'nîmes': 715,
    'villeurbanne': 465,
    'clermont-ferrand': 420,
    'aix-en-provence': 775,
    'brest': 590
  },
  'lyon': {
    'paris': 465,
    'marseille': 315,
    'toulouse': 540,
    'nice': 470,
    'nantes': 660,
    'strasbourg': 490,
    'montpellier': 300,
    'bordeaux': 560,
    'lille': 690,
    'rennes': 680,
    'reims': 490,
    'toulon': 390,
    'grenoble': 105,
    'dijon': 190,
    'angers': 580,
    'nîmes': 250,
    'villeurbanne': 10,
    'clermont-ferrand': 165,
    'aix-en-provence': 315,
    'brest': 850
  },
  'marseille': {
    'paris': 775,
    'lyon': 315,
    'toulouse': 405,
    'nice': 200,
    'nantes': 900,
    'strasbourg': 800,
    'montpellier': 170,
    'bordeaux': 650,
    'lille': 1000,
    'rennes': 950,
    'reims': 800,
    'toulon': 65,
    'grenoble': 280,
    'dijon': 530,
    'angers': 820,
    'nîmes': 120,
    'villeurbanne': 315,
    'clermont-ferrand': 430,
    'aix-en-provence': 30,
    'brest': 1150
  }
};

/**
 * Extrait le nom de la ville d'une adresse
 * @param {string} address - Adresse complète
 * @returns {string} Nom de la ville normalisé
 */
function extractCityName(address) {
  if (!address) return '';
  
  // Nettoyer l'adresse et extraire la ville
  const cleaned = address.toLowerCase()
    .replace(/[0-9]+/g, '') // Supprimer les numéros
    .replace(/rue|avenue|boulevard|place|chemin|impasse|allée|bis|ter/g, '') // Supprimer les types de voies
    .replace(/[,.-]/g, ' ') // Remplacer la ponctuation par des espaces
    .replace(/france/g, '') // Supprimer "France"
    .trim();
  
  // Chercher des correspondances avec les villes connues
  const words = cleaned.split(/\s+/).filter(word => word.length > 2);
  
  // D'abord, chercher une correspondance exacte
  for (const word of words) {
    if (CITY_DISTANCES[word]) {
      return word;
    }
  }
  
  // Ensuite, chercher des correspondances partielles
  for (const word of words) {
    for (const city of Object.keys(CITY_DISTANCES)) {
      if (city.includes(word) || word.includes(city)) {
        return city;
      }
    }
  }
  
  // Chercher des variantes communes
  const cityVariants = {
    'aix': 'aix-en-provence',
    'clermont': 'clermont-ferrand',
    'saint-etienne': 'saint-étienne'
  };
  
  for (const word of words) {
    if (cityVariants[word]) {
      return cityVariants[word];
    }
  }
  
  // Si aucune correspondance, retourner le mot le plus long (probablement la ville)
  const longestWord = words.reduce((longest, current) => 
    current.length > longest.length ? current : longest, '');
  
  return longestWord;
}

/**
 * Détermine la taille d'un colis basée sur ses dimensions
 * @param {string} dimensions - Format "LxlxH" en cm
 * @returns {string} Taille (S, M, L, XL, XXL, XXXL)
 */
export function calculatePackageSize(dimensions) {
  if (!dimensions) return 'M'; // Taille par défaut
  
  try {
    const [length, width, height] = dimensions.split('x').map(d => parseFloat(d.trim()));
    
    if (isNaN(length) || isNaN(width) || isNaN(height)) {
      return 'M'; // Taille par défaut si les dimensions sont invalides
    }
    
    const volume = length * width * height;
    
    // Déterminer la taille basée sur le volume
    for (const [size, threshold] of Object.entries(PRICING_CONFIG.SIZE_THRESHOLDS)) {
      if (volume <= threshold.maxVolume) {
        return size;
      }
    }
    
    return 'XXXL'; // Par défaut pour les très gros colis
  } catch (error) {
    console.error('Erreur lors du calcul de la taille:', error);
    return 'M'; // Taille par défaut en cas d'erreur
  }
}

/**
 * Calcule le prix d'un colis
 * @param {Object} params - Paramètres de calcul
 * @param {number} params.distance - Distance en kilomètres
 * @param {number} params.weight - Poids en kg
 * @param {string} params.dimensions - Dimensions au format "LxlxH" en cm
 * @returns {Object} Objet contenant le prix et les détails du calcul
 */
export function calculatePackagePrice({ distance, weight, dimensions }) {
  try {
    // Valeurs par défaut
    const distanceKm = Math.max(distance || 0, 1); // Minimum 1 km
    const weightKg = Math.max(weight || 0.5, 0.5); // Minimum 0.5 kg
    
    // Déterminer la taille du colis
    const packageSize = calculatePackageSize(dimensions);
    const sizeMultiplier = PRICING_CONFIG.SIZE_MULTIPLIERS[packageSize] || 1;
    
    // Calculs
    const distancePrice = distanceKm * PRICING_CONFIG.BASE_PRICE_PER_KM;
    const weightPrice = weightKg * PRICING_CONFIG.PRICE_PER_KG;
    const basePrice = distancePrice + weightPrice;
    const sizeAdjustedPrice = basePrice * sizeMultiplier;
    
    // Prix final (minimum garanti)
    const finalPrice = Math.max(sizeAdjustedPrice, PRICING_CONFIG.MINIMUM_PRICE);
    
    return {
      price: Math.round(finalPrice * 100) / 100, // Arrondi à 2 décimales
      details: {
        distance: distanceKm,
        weight: weightKg,
        packageSize,
        sizeMultiplier,
        distancePrice: Math.round(distancePrice * 100) / 100,
        weightPrice: Math.round(weightPrice * 100) / 100,
        basePrice: Math.round(basePrice * 100) / 100,
        sizeAdjustedPrice: Math.round(sizeAdjustedPrice * 100) / 100,
        minimumPrice: PRICING_CONFIG.MINIMUM_PRICE
      }
    };
  } catch (error) {
    console.error('Erreur lors du calcul du prix:', error);
    return {
      price: PRICING_CONFIG.MINIMUM_PRICE,
      details: {
        error: error.message
      }
    };
  }
}

/**
 * Calcule la distance entre deux adresses
 * @param {string} origin - Adresse de départ
 * @param {string} destination - Adresse d'arrivée
 * @returns {Promise<number>} Distance en kilomètres
 */
export async function calculateDistance(origin, destination) {
  try {
    // Extraire les noms de villes
    const originCity = extractCityName(origin);
    const destinationCity = extractCityName(destination);
    
    console.log(`Calculating distance from ${originCity} to ${destinationCity}`);
    
    // Si on a les deux villes dans notre base de données
    if (originCity && destinationCity && CITY_DISTANCES[originCity] && CITY_DISTANCES[originCity][destinationCity]) {
      return CITY_DISTANCES[originCity][destinationCity];
    }
    
    // Si on a une ville dans notre base, essayer l'inverse
    if (originCity && destinationCity && CITY_DISTANCES[destinationCity] && CITY_DISTANCES[destinationCity][originCity]) {
      return CITY_DISTANCES[destinationCity][originCity];
    }
    
    // Si on ne trouve pas de correspondance exacte, estimer basé sur les villes connues
    if (originCity && CITY_DISTANCES[originCity]) {
      // Prendre une distance moyenne depuis cette ville
      const distances = Object.values(CITY_DISTANCES[originCity]);
      const averageDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
      return Math.round(averageDistance * (0.5 + Math.random())); // Variation aléatoire
    }
    
    if (destinationCity && CITY_DISTANCES[destinationCity]) {
      // Prendre une distance moyenne vers cette ville
      const distances = Object.values(CITY_DISTANCES[destinationCity]);
      const averageDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
      return Math.round(averageDistance * (0.5 + Math.random())); // Variation aléatoire
    }
    
    // Estimation par défaut basée sur une distance moyenne en France
    const estimatedDistance = Math.random() * 400 + 50; // Entre 50 et 450 km
    return Math.round(estimatedDistance);
    
  } catch (error) {
    console.error('Erreur lors du calcul de la distance:', error);
    return 200; // Distance par défaut en cas d'erreur
  }
}

/**
 * Calcule le prix complet d'un colis avec distance automatique
 * @param {Object} params - Paramètres de calcul
 * @param {string} params.pickupAddress - Adresse de départ
 * @param {string} params.deliveryAddress - Adresse d'arrivée
 * @param {number} params.weight - Poids en kg
 * @param {string} params.dimensions - Dimensions au format "LxlxH" en cm
 * @returns {Promise<Object>} Objet contenant le prix et les détails
 */
export async function calculateFullPackagePrice({ pickupAddress, deliveryAddress, weight, dimensions }) {
  try {
    // Calculer la distance
    const distance = await calculateDistance(pickupAddress, deliveryAddress);
    
    // Calculer le prix
    const priceCalculation = calculatePackagePrice({ distance, weight, dimensions });
    
    return {
      ...priceCalculation,
      details: {
        ...priceCalculation.details,
        pickupAddress,
        deliveryAddress
      }
    };
  } catch (error) {
    console.error('Erreur lors du calcul complet du prix:', error);
    return {
      price: PRICING_CONFIG.MINIMUM_PRICE,
      details: {
        error: error.message
      }
    };
  }
} 