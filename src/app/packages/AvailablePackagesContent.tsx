'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Package {
  id: string;
  title: string;
  description: string | null;
  weight: number | null;
  price: number | null;
  sizeLabel: string | null;
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface User {
  id: string;
  role: string;
}

export default function AvailablePackagesContent() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [proposingMatch, setProposingMatch] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
    fetchAvailablePackages();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchAvailablePackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/packages?status=PENDING&available=true');
      if (!response.ok) throw new Error('Failed to fetch packages');
      
      const data = await response.json();
      setPackages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const proposeMatch = async (packageId: string, rideId: string, proposedPrice?: number) => {
    try {
      setProposingMatch(packageId);
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          rideId,
          price: proposedPrice,
          proposedByUserId: user?.id
        }),
      });

      if (response.ok) {
        alert('Match proposé avec succès ! L\'expéditeur sera notifié.');
        fetchAvailablePackages(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Erreur lors de la proposition de match');
      }
    } catch (error) {
      console.error('Error proposing match:', error);
      alert('Erreur lors de la proposition de match');
    } finally {
      setProposingMatch(null);
    }
  };

  const handleProposeMatch = async (packageId: string) => {
    // First, we need to get the user's available rides
    try {
      const response = await fetch('/api/rides?status=AVAILABLE&userId=' + user?.id);
      if (!response.ok) throw new Error('Failed to fetch rides');
      
      const rides = await response.json();
      
      if (rides.length === 0) {
        alert('Vous devez d\'abord créer un trajet disponible pour proposer un match.');
        return;
      }

      // For now, we'll use the first available ride
      // In a real app, you'd want to show a modal to let the user choose
      const selectedRide = rides[0];
      const proposedPrice = prompt('Proposer un prix (optionnel) :');
      
      await proposeMatch(packageId, selectedRide.id, proposedPrice ? parseFloat(proposedPrice) : undefined);
    } catch (error) {
      console.error('Error fetching rides:', error);
      alert('Erreur lors de la récupération de vos trajets');
    }
  };

  if (loading) {
    return <div className="py-4 text-center">Chargement des colis disponibles...</div>;
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!user || user.role !== 'CARRIER') {
    return (
      <div className="p-4 rounded-lg bg-yellow-50">
        <p className="text-yellow-600">Cette page est réservée aux transporteurs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Colis Disponibles</h2>
        <button
          onClick={fetchAvailablePackages}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Actualiser
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">Aucun colis disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="p-6 bg-white border rounded-lg shadow-md">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{pkg.title}</h3>
                {pkg.price && pkg.sizeLabel && (
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded">
                      {pkg.price}€
                    </span>
                    <span className="px-2 py-1 text-sm text-gray-800 bg-gray-100 rounded">
                      {pkg.sizeLabel}
                    </span>
                  </div>
                )}
              </div>

              {pkg.description && (
                <p className="mb-4 text-sm text-gray-600">{pkg.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Départ:</span>
                  <p className="text-gray-600">{pkg.pickupAddress}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Arrivée:</span>
                  <p className="text-gray-600">{pkg.deliveryAddress}</p>
                </div>
                
                {pkg.weight && (
                  <div>
                    <span className="font-medium text-gray-700">Poids:</span>
                    <span className="ml-1 text-gray-600">{pkg.weight} kg</span>
                  </div>
                )}

                {pkg.pickupDate && (
                  <div>
                    <span className="font-medium text-gray-700">Date de collecte:</span>
                    <span className="ml-1 text-gray-600">
                      {format(new Date(pkg.pickupDate), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                )}

                <div>
                  <span className="font-medium text-gray-700">Expéditeur:</span>
                  <span className="ml-1 text-gray-600">
                    {pkg.user.firstName && pkg.user.lastName 
                      ? `${pkg.user.firstName} ${pkg.user.lastName}`
                      : pkg.user.name || pkg.user.email
                    }
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Publié le:</span>
                  <span className="ml-1 text-gray-600">
                    {format(new Date(pkg.createdAt), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleProposeMatch(pkg.id)}
                  disabled={proposingMatch === pkg.id}
                  className="w-full px-4 py-2 text-white transition-colors bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {proposingMatch === pkg.id ? 'Proposition en cours...' : 'Proposer de transporter'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 