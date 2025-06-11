import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchMatches();
  }, [filter]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' ? '/api/matches' : `/api/matches?status=${filter}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      } else {
        setError('Failed to fetch matches');
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Error fetching matches');
    } finally {
      setLoading(false);
    }
  };

  const updateMatchStatus = async (matchId, newStatus) => {
    try {
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
        fetchMatches(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update match');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      setError('Error updating match');
    }
  };

  const deleteMatch = async (matchId) => {
    if (!confirm('Are you sure you want to delete this match?')) {
      return;
    }

    try {
      const response = await fetch(`/api/matches?id=${matchId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMatches(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete match');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      setError('Error deleting match');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PROPOSED': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED_BY_SENDER': return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED_BY_CARRIER': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canUpdateStatus = (match, newStatus) => {
    if (!user) return false;
    
    const isPackageOwner = match.package.userId === user.id;
    const isRideOwner = match.ride.userId === user.id;
    
    // Logic for status transitions
    if (match.status === 'PROPOSED') {
      return (isPackageOwner || isRideOwner) && (newStatus === 'ACCEPTED_BY_SENDER' || newStatus === 'ACCEPTED_BY_CARRIER' || newStatus === 'REJECTED');
    }
    
    if (match.status === 'ACCEPTED_BY_SENDER' || match.status === 'ACCEPTED_BY_CARRIER') {
      return (isPackageOwner || isRideOwner) && newStatus === 'CONFIRMED';
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Matches</h1>
          <p className="mt-2 text-gray-600">Manage your package and ride matches</p>
        </div>

        {error && (
          <div className="p-4 mb-6 border border-red-200 rounded-md bg-red-50">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'all', label: 'All Matches' },
              { key: 'PROPOSED', label: 'Proposed' },
              { key: 'CONFIRMED', label: 'Confirmed' },
              { key: 'REJECTED', label: 'Rejected' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Matches List */}
        <div className="space-y-6">
          {matches.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-6xl text-gray-400">📦</div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">No matches found</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You don't have any matches yet. Create a package or ride to get started!"
                  : `No matches with status "${filter}" found.`
                }
              </p>
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="p-6 bg-white rounded-lg shadow-md">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                      {match.status.replace('_', ' ')}
                    </span>
                    {match.price && (
                      <span className="text-lg font-semibold text-green-600">
                        €{match.price}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(match.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Package Info */}
                  <div className="p-4 border rounded-lg">
                    <h3 className="mb-2 font-semibold text-gray-900">📦 Package</h3>
                    <h4 className="mb-2 font-medium text-blue-600">{match.package.title}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>From:</strong> {match.package.pickupAddress}</p>
                      <p><strong>To:</strong> {match.package.deliveryAddress}</p>
                      {match.package.weight && <p><strong>Weight:</strong> {match.package.weight}kg</p>}
                      <p><strong>Owner:</strong> {match.package.user.firstName} {match.package.user.lastName}</p>
                    </div>
                  </div>

                  {/* Ride Info */}
                  <div className="p-4 border rounded-lg">
                    <h3 className="mb-2 font-semibold text-gray-900">🚗 Ride</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>From:</strong> {match.ride.startLocation}</p>
                      <p><strong>To:</strong> {match.ride.endLocation}</p>
                      <p><strong>Departure:</strong> {new Date(match.ride.departureTime).toLocaleString()}</p>
                      {match.ride.vehicleType && <p><strong>Vehicle:</strong> {match.ride.vehicleType}</p>}
                      <p><strong>Driver:</strong> {match.ride.user.firstName} {match.ride.user.lastName}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                  {match.status === 'PROPOSED' && (
                    <>
                      {canUpdateStatus(match, 'ACCEPTED_BY_SENDER') && (
                        <button
                          onClick={() => updateMatchStatus(match.id, 'ACCEPTED_BY_SENDER')}
                          className="px-4 py-2 text-white transition-colors bg-green-600 rounded-md hover:bg-green-700"
                        >
                          Accept Match
                        </button>
                      )}
                      {canUpdateStatus(match, 'REJECTED') && (
                        <button
                          onClick={() => updateMatchStatus(match.id, 'REJECTED')}
                          className="px-4 py-2 text-white transition-colors bg-red-600 rounded-md hover:bg-red-700"
                        >
                          Reject Match
                        </button>
                      )}
                    </>
                  )}

                  {(match.status === 'ACCEPTED_BY_SENDER' || match.status === 'ACCEPTED_BY_CARRIER') && 
                   canUpdateStatus(match, 'CONFIRMED') && (
                    <button
                      onClick={() => updateMatchStatus(match.id, 'CONFIRMED')}
                      className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Confirm Match
                    </button>
                  )}

                  {match.status === 'CONFIRMED' && (
                    <button
                      onClick={() => router.push(`/messages?conversationWith=${
                        match.package.userId === user?.id ? match.ride.userId : match.package.userId
                      }`)}
                      className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Send Message
                    </button>
                  )}

                  {(match.status === 'PROPOSED' || match.status === 'REJECTED') && (
                    <button
                      onClick={() => deleteMatch(match.id)}
                      className="px-4 py-2 text-white transition-colors bg-gray-600 rounded-md hover:bg-gray-700"
                    >
                      Delete Match
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 