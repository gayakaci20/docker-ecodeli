'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Match {
  id: string;
  status: 'PROPOSED' | 'ACCEPTED_BY_SENDER' | 'ACCEPTED_BY_CARRIER' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  price: number | null;
  createdAt: string;
  package: {
    id: string;
    title: string;
    description: string | null;
    weight: number | null;
    pickupAddress: string;
    deliveryAddress: string;
    user: {
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
  ride: {
    id: string;
    startLocation: string;
    endLocation: string;
    departureTime: string;
    vehicleType: string | null;
    user: {
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}

interface User {
  id: string;
  role: string;
}

export default function ConfirmedMatchesContent() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser();
    fetchConfirmedMatches();
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

  const fetchConfirmedMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/matches?status=ACCEPTED_BY_SENDER,CONFIRMED');
      if (!response.ok) throw new Error('Failed to fetch matches');
      
      const data = await response.json();
      setMatches(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED_BY_SENDER': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACCEPTED_BY_SENDER': return 'Accepté par l\'expéditeur';
      case 'CONFIRMED': return 'Confirmé';
      default: return status;
    }
  };

  const getUserName = (userObj: any) => {
    return userObj.firstName && userObj.lastName 
      ? `${userObj.firstName} ${userObj.lastName}`
      : userObj.name || userObj.email;
  };

  if (loading) {
    return <div className="text-center py-4">Chargement des matches...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const userMatches = matches.filter(match => 
    user && (match.package.user.id === user.id || match.ride.user.id === user.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Mes Matches Confirmés</h2>
        <button
          onClick={fetchConfirmedMatches}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Actualiser
        </button>
      </div>

      {userMatches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun match confirmé pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow-md p-6 border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {match.package.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Match créé le {format(new Date(match.createdAt), 'dd/MM/yyyy à HH:mm')}
                  </p>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(match.status)}`}>
                  {getStatusText(match.status)}
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Package Info */}
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-semibold text-blue-900 mb-3">📦 Colis</h4>
                  <div className="space-y-2 text-sm">
                    {match.package.description && (
                      <p className="text-gray-700 mb-2">{match.package.description}</p>
                    )}
                    <div>
                      <span className="font-medium">Expéditeur:</span>
                      <p className="text-gray-700">{getUserName(match.package.user)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Départ:</span>
                      <p className="text-gray-600">{match.package.pickupAddress}</p>
                    </div>
                    <div>
                      <span className="font-medium">Arrivée:</span>
                      <p className="text-gray-600">{match.package.deliveryAddress}</p>
                    </div>
                    {match.package.weight && (
                      <p><span className="font-medium">Poids:</span> {match.package.weight} kg</p>
                    )}
                  </div>
                </div>

                {/* Ride Info */}
                <div className="p-4 border rounded-lg bg-green-50">
                  <h4 className="font-semibold text-green-900 mb-3">🚗 Trajet</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Transporteur:</span>
                      <p className="text-gray-700">{getUserName(match.ride.user)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Départ:</span>
                      <p className="text-gray-600">{match.ride.startLocation}</p>
                    </div>
                    <div>
                      <span className="font-medium">Arrivée:</span>
                      <p className="text-gray-600">{match.ride.endLocation}</p>
                    </div>
                    <div>
                      <span className="font-medium">Date de départ:</span>
                      <p className="text-gray-600">
                        {format(new Date(match.ride.departureTime), 'dd/MM/yyyy à HH:mm')}
                      </p>
                    </div>
                    {match.ride.vehicleType && (
                      <p><span className="font-medium">Véhicule:</span> {match.ride.vehicleType}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Info */}
              {match.price && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-yellow-800">Prix convenu:</span>
                    <span className="text-xl font-bold text-yellow-900">{match.price}€</span>
                  </div>
                </div>
              )}

              {/* Role-specific info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                {user && match.package.user.id === user.id ? (
                  <p className="text-gray-700 text-sm">
                    <strong>Votre rôle:</strong> Expéditeur - Votre colis sera transporté par {getUserName(match.ride.user)}
                  </p>
                ) : (
                  <p className="text-gray-700 text-sm">
                    <strong>Votre rôle:</strong> Transporteur - Vous transportez le colis de {getUserName(match.package.user)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 