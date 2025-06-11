# Système de Tarification Automatique - EcoDeli

## Vue d'ensemble

Le système de tarification automatique d'EcoDeli calcule le prix d'un colis en fonction de trois facteurs principaux :
- **Distance** entre les adresses de départ et d'arrivée
- **Poids** du colis
- **Taille** du colis (basée sur les dimensions)

## Composants du Système

### 1. Calcul de la Distance

Le système utilise une base de données des distances entre les principales villes françaises pour estimer la distance de transport.

**Villes supportées :**
- Paris, Lyon, Marseille, Toulouse, Nice, Nantes, Strasbourg, Montpellier, Bordeaux, Lille, Rennes, Reims, Toulon, Grenoble, Dijon, Angers, Nîmes, Villeurbanne, Clermont-Ferrand, Aix-en-Provence, Brest

**Fonctionnement :**
1. Extraction automatique du nom de ville depuis l'adresse complète
2. Recherche dans la base de données des distances
3. Si aucune correspondance exacte, estimation basée sur les distances moyennes

### 2. Classification par Taille

Les colis sont automatiquement classés selon leur volume (L × l × h) :

| Taille | Volume max | Multiplicateur | Exemple |
|--------|------------|----------------|---------|
| **S** | 6 000 cm³ | ×1.0 | 30×20×10 cm |
| **M** | 60 000 cm³ | ×1.2 | 50×40×30 cm |
| **L** | 240 000 cm³ | ×1.5 | 80×60×50 cm |
| **XL** | 768 000 cm³ | ×2.0 | 120×80×80 cm |
| **XXL** | 1 500 000 cm³ | ×2.5 | 150×100×100 cm |
| **XXXL** | > 1 500 000 cm³ | ×3.0 | Plus de 150×100×100 cm |

### 3. Formule de Calcul

```
Prix = max(
  (Distance × 0.5€/km + Poids × 2€/kg) × Multiplicateur_Taille,
  5€ minimum
)
```

**Paramètres :**
- **Prix de base par km :** 0,50€
- **Prix par kg :** 2€
- **Prix minimum :** 5€

## Exemples de Calcul

### Exemple 1 : Petit colis léger
- **Distance :** Paris → Lyon (465 km)
- **Poids :** 2 kg
- **Dimensions :** 30×20×10 cm (Taille S)
- **Calcul :** (465 × 0.5 + 2 × 2) × 1.0 = 236.5€

### Exemple 2 : Colis moyen
- **Distance :** Marseille → Nice (200 km)
- **Poids :** 5 kg
- **Dimensions :** 50×40×30 cm (Taille M)
- **Calcul :** (200 × 0.5 + 5 × 2) × 1.2 = 132€

### Exemple 3 : Gros colis lourd
- **Distance :** Toulouse → Bordeaux (250 km)
- **Poids :** 25 kg
- **Dimensions :** 80×60×50 cm (Taille L)
- **Calcul :** (250 × 0.5 + 25 × 2) × 1.5 = 262.5€

## Implémentation Technique

### Fichiers Principaux

1. **`lib/priceCalculator.js`** - Logique de calcul
2. **`pages/api/calculate-price.js`** - API de calcul
3. **`pages/api/packages.js`** - Intégration lors de la création
4. **`components/PriceDisplay.jsx`** - Affichage du prix

### API Endpoints

#### POST `/api/calculate-price`
Calcule le prix d'un colis en temps réel.

**Paramètres :**
```json
{
  "pickupAddress": "Paris, France",
  "deliveryAddress": "Lyon, France",
  "weight": 5,
  "dimensions": "40x30x20"
}
```

**Réponse :**
```json
{
  "success": true,
  "price": 291,
  "details": {
    "distance": 465,
    "weight": 5,
    "packageSize": "M",
    "sizeMultiplier": 1.2,
    "distancePrice": 232.5,
    "weightPrice": 10,
    "basePrice": 242.5,
    "sizeAdjustedPrice": 291,
    "minimumPrice": 5
  }
}
```

### Intégration Frontend

Le formulaire de création de colis (`pages/exp.jsx`) calcule automatiquement le prix en temps réel lorsque l'utilisateur saisit :
- Les adresses de départ et d'arrivée
- Le poids du colis
- Les dimensions (optionnel)

Le prix est affiché avec un délai de 1 seconde pour éviter trop d'appels API.

## Améliorations Futures

1. **Intégration Google Maps API** pour des distances plus précises
2. **Tarification dynamique** basée sur la demande
3. **Réductions** pour les utilisateurs réguliers
4. **Tarifs spéciaux** pour certains types d'objets
5. **Calcul des émissions CO2** pour l'aspect écologique

## Configuration

Les tarifs peuvent être ajustés dans `lib/priceCalculator.js` :

```javascript
const PRICING_CONFIG = {
  BASE_PRICE_PER_KM: 0.5,    // Prix par kilomètre
  MINIMUM_PRICE: 5,          // Prix minimum
  PRICE_PER_KG: 2,           // Prix par kilogramme
  SIZE_MULTIPLIERS: {        // Multiplicateurs par taille
    S: 1,
    M: 1.2,
    L: 1.5,
    XL: 2,
    XXL: 2.5,
    XXXL: 3
  }
};
``` 