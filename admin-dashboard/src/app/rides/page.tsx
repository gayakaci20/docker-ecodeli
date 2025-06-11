'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Ride {
  id: string;
  startLocation: string;
  endLocation: string;
  departureTime: string;
  estimatedArrivalTime: string | null;
  vehicleType: string | null;
  availableSeats: number | null;
  maxPackageWeight: number | null;
  maxPackageSize: string | null;
  pricePerKg: number | null;
  pricePerSeat: number | null;
  notes: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
  matches: Array<{
    id: string;
    status: string;
    package: {
      id: string;
      title: string;
    };
  }>;
}

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRides();
  }, [statusFilter]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/rides?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch rides');
      
      const data = await response.json();
      setRides(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateRideStatus = async (rideId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/rides', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: rideId,
          status: newStatus
        }),
      });

      if (response.ok) {
        fetchRides(); // Refresh the list
        alert(`Ride status updated to ${newStatus}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error updating ride');
      }
    } catch (error) {
      console.error('Error updating ride:', error);
      alert('Error updating ride');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'FULL': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (user: any) => {
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.name || user.email;
  };

  const filteredRides = rides.filter(ride => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      ride.id.toLowerCase().includes(searchLower) ||
      ride.startLocation.toLowerCase().includes(searchLower) ||
      ride.endLocation.toLowerCase().includes(searchLower) ||
      getUserName(ride.user).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-black">Rides</h1>
        <button
          onClick={fetchRides}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
      
      {/* Filters */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-64">
            <label className="block mb-1 text-sm font-medium text-black">Search</label>
            <input 
              type="text" 
              placeholder="Search by location or carrier"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block mb-1 text-sm font-medium text-black">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="FULL">Full</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="py-8 text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading rides...</p>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-50">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Rides Table */}
      {!loading && !error && (
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Carrier
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  From → To 
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Departure
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Vehicle & Capacity
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Matches
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRides.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No rides found
                  </td>
                </tr>
              ) : (
                filteredRides.map((ride) => (
                  <tr key={ride.id} className="text-sm text-gray-600">
                    <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                      {ride.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{getUserName(ride.user)}</div>
                        <div className="text-xs text-gray-500">{ride.user.email}</div>
                        <div className="text-xs text-gray-400">Role: {ride.user.role}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {ride.startLocation} → {ride.endLocation}
                        </div>
                        {ride.notes && (
                          <div className="mt-1 text-xs text-gray-400">{ride.notes}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {format(new Date(ride.departureTime), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(ride.departureTime), 'HH:mm')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ride.status)}`}>
                        {ride.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        {ride.vehicleType && (
                          <div><strong>Vehicle:</strong> {ride.vehicleType}</div>
                        )}
                        {ride.availableSeats && (
                          <div><strong>Seats:</strong> {ride.availableSeats}</div>
                        )}
                        {ride.maxPackageWeight && (
                          <div><strong>Max weight:</strong> {ride.maxPackageWeight}kg</div>
                        )}
                        {ride.pricePerKg && (
                          <div><strong>Price/kg:</strong> €{ride.pricePerKg}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        {ride.matches.length === 0 ? (
                          <span className="text-gray-400">No matches</span>
                        ) : (
                          <div>
                            <div className="font-medium">{ride.matches.length} match(es)</div>
                            {ride.matches.slice(0, 2).map(match => (
                              <div key={match.id} className="text-gray-500">
                                {match.package.title} ({match.status})
                              </div>
                            ))}
                            {ride.matches.length > 2 && (
                              <div className="text-gray-400">+{ride.matches.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {ride.status === 'AVAILABLE' && (
                          <button
                            onClick={() => updateRideStatus(ride.id, 'FULL')}
                            className="text-xs text-yellow-600 hover:text-yellow-900"
                          >
                            Mark Full
                          </button>
                        )}
                        {(ride.status === 'AVAILABLE' || ride.status === 'FULL') && (
                          <button
                            onClick={() => updateRideStatus(ride.id, 'COMPLETED')}
                            className="text-xs text-green-600 hover:text-green-900"
                          >
                            Complete
                          </button>
                        )}
                        {ride.status !== 'CANCELLED' && ride.status !== 'COMPLETED' && (
                          <button
                            onClick={() => updateRideStatus(ride.id, 'CANCELLED')}
                            className="text-xs text-red-600 hover:text-red-900"
                          >
                            Cancel
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
              Showing <span className="font-medium">{filteredRides.length}</span> of <span className="font-medium">{rides.length}</span> results
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 