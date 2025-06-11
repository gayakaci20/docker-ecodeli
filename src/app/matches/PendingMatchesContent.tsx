'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Match {
  id: string;
  status: 'PROPOSED' | 'ACCEPTED_BY_SENDER' | 'ACCEPTED_BY_CARRIER' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  price: number | null;
  proposedByUserId: string | null;
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

export default function PendingMatchesContent() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [updatingMatch, setUpdatingMatch] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
    fetchPendingMatches();
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

  const fetchPendingMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/matches?status=PROPOSED');
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

  const updateMatchStatus = async (matchId: string, newStatus: string) => {
    try {
      setUpdatingMatch(matchId);
      const response = await fetch('/api/matches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: matchId,
          status: newStatus
        }),
      });

      if (response.ok) {
        fetchPendingMatches(); // Refresh the list
        const statusText = newStatus === 'ACCEPTED_BY_SENDER' ? 'acceptée' : 'rejetée';
        alert(`Demande ${statusText} avec succès !`);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setUpdatingMatch(null);
    }
  };

  const canUpdateMatch = (match: Match) => {
    if (!user) return false;
    
    // Only package owner (sender) can accept/reject proposed matches
    return match.package.user.id === user.id && match.status === 'PROPOSED';
  };

  const getCarrierName = (match: Match) => {
    const carrier = match.ride.user;
    return carrier.firstName && carrier.lastName 
      ? `${carrier.firstName} ${carrier.lastName}`
      : carrier.name || carrier.email;
  };

  if (loading) {
    return <div className="text-center py-4">Chargement des demandes...</div>;
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
        <h2 className="text-xl font-semibold">Demandes de Transport</h2>
        <button
          onClick={fetchPendingMatches}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Actualiser
        </button>
      </div>

      {userMatches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune demande en attente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow-md p-6 border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Demande de transport pour "{match.package.title}"
                  </h3>
                  <p className="text-sm text-gray-500">
                    Proposée le {format(new Date(match.createdAt), 'dd/MM/yyyy à HH:mm')}
                  </p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                  En attente
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Package Info */}
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-semibold text-blue-900 mb-3">📦 Votre Colis</h4>
                  <div className="space-y-2 text-sm">
                    {match.package.description && (
                      <p className="text-gray-700">{match.package.description}</p>
                    )}
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
                  <h4 className="font-semibold text-green-900 mb-3">🚗 Trajet Proposé</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Transporteur:</span>
                      <p className="text-gray-700">{getCarrierName(match)}</p>
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
                    {match.price && (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <span className="font-medium text-green-700">Prix proposé: {match.price}€</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {canUpdateMatch(match) && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => updateMatchStatus(match.id, 'ACCEPTED_BY_SENDER')}
                    disabled={updatingMatch === match.id}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {updatingMatch === match.id ? 'Traitement...' : '✓ Accepter la demande'}
                  </button>
                  <button
                    onClick={() => updateMatchStatus(match.id, 'REJECTED')}
                    disabled={updatingMatch === match.id}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {updatingMatch === match.id ? 'Traitement...' : '✗ Rejeter la demande'}
                  </button>
                </div>
              )}

              {/* Info for carriers */}
              {user && match.ride.user.id === user.id && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Votre proposition est en attente.</strong> L'expéditeur va examiner votre demande et vous répondra bientôt.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 