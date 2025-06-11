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
    user: {
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMatches();
  }, [statusFilter]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/matches?${params.toString()}`);
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
        alert(`Match status updated to ${newStatus}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error updating match');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Error updating match');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROPOSED': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED_BY_SENDER': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (user: any) => {
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.name || user.email;
  };

  const filteredMatches = matches.filter(match => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      match.id.toLowerCase().includes(searchLower) ||
      match.package.title.toLowerCase().includes(searchLower) ||
      getUserName(match.package.user).toLowerCase().includes(searchLower) ||
      getUserName(match.ride.user).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Matches</h1>
        <button
          onClick={fetchMatches}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
      
      {/* Filters */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-64">
            <label className="block mb-1 text-sm font-medium text-gray-700">Search</label>
            <input 
              type="text" 
              placeholder="Search by ID, package, or user"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="PROPOSED">Proposed</option>
              <option value="ACCEPTED_BY_SENDER">Accepted By Sender</option>
              <option value="ACCEPTED_BY_CARRIER">Accepted By Carrier</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading matches...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Matches Table */}
      {!loading && !error && (
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Package
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Ride
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No matches found
                  </td>
                </tr>
              ) : (
                filteredMatches.map((match) => (
                  <tr key={match.id} className="text-sm text-gray-600">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      {match.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{match.package.title}</div>
                        <div className="text-xs text-gray-500">
                          by {getUserName(match.package.user)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {match.package.pickupAddress} → {match.package.deliveryAddress}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {match.ride.startLocation} → {match.ride.endLocation}
                        </div>
                        <div className="text-xs text-gray-500">
                          by {getUserName(match.ride.user)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {format(new Date(match.ride.departureTime), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(match.status)}`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {match.price ? `€${match.price}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(match.createdAt), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {match.status === 'PROPOSED' && (
                          <>
                            <button
                              onClick={() => updateMatchStatus(match.id, 'ACCEPTED_BY_SENDER')}
                              className="text-green-600 hover:text-green-900 text-xs"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => updateMatchStatus(match.id, 'REJECTED')}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {match.status === 'ACCEPTED_BY_SENDER' && (
                          <button
                            onClick={() => updateMatchStatus(match.id, 'CONFIRMED')}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    </td>
            </tr>
                ))
              )}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredMatches.length}</span> of <span className="font-medium">{matches.length}</span> results
          </div>
          </div>
        </div>
      )}
    </div>
  );
} 