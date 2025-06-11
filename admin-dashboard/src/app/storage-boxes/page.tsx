'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface StorageBox {
  id: string;
  location: string;
  size: string;
  pricePerDay: number;
  isOccupied: boolean;
  description: string;
  createdAt: string;
  rentals: BoxRental[];
}

interface BoxRental {
  id: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  accessCode: string;
  isActive: boolean;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function StorageBoxesPage() {
  const [storageBoxes, setStorageBoxes] = useState<StorageBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBox, setNewBox] = useState({
    location: '',
    size: 'MEDIUM',
    pricePerDay: 0,
    description: ''
  });

  useEffect(() => {
    fetchStorageBoxes();
  }, []);

  const fetchStorageBoxes = async () => {
    try {
      const response = await fetch('/api/storage-boxes');
      if (response.ok) {
        const data = await response.json();
        setStorageBoxes(data);
      }
    } catch (error) {
      console.error('Error fetching storage boxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStorageBox = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/storage-boxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBox),
      });

      if (response.ok) {
        const addedBox = await response.json();
        setStorageBoxes([...storageBoxes, addedBox]);
        setNewBox({ location: '', size: 'MEDIUM', pricePerDay: 0, description: '' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding storage box:', error);
    }
  };

  const deleteStorageBox = async (boxId: string) => {
    if (!confirm('Are you sure you want to delete this storage box?')) return;
    
    try {
      const response = await fetch(`/api/storage-boxes/${boxId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStorageBoxes(storageBoxes.filter(box => box.id !== boxId));
      }
    } catch (error) {
      console.error('Error deleting storage box:', error);
    }
  };

  const filteredBoxes = storageBoxes.filter(box => {
    const matchesFilter = filter === 'all' || 
      (filter === 'occupied' && box.isOccupied) ||
      (filter === 'available' && !box.isOccupied);
    
    const matchesSearch = box.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      box.size.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getSizeColor = (size: string) => {
    const colors: Record<string, string> = {
      SMALL: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      LARGE: 'bg-purple-100 text-purple-800',
      EXTRA_LARGE: 'bg-red-100 text-red-800',
    };
    return colors[size] || colors.MEDIUM;
  };

  // Calculate stats
  const totalBoxes = storageBoxes.length;
  const occupiedBoxes = storageBoxes.filter(b => b.isOccupied).length;
  const availableBoxes = totalBoxes - occupiedBoxes;
  const totalRevenue = storageBoxes
    .flatMap(box => box.rentals)
    .filter(rental => rental.isActive)
    .reduce((sum, rental) => sum + (rental.totalCost || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Storage Boxes Management</h1>
          <p className="text-gray-600 mt-2">Manage storage boxes and rentals</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add New Box
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Boxes</h3>
          <div className="text-2xl font-bold text-gray-900">{totalBoxes}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Occupied</h3>
          <div className="text-2xl font-bold text-red-600">{occupiedBoxes}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Available</h3>
          <div className="text-2xl font-bold text-green-600">{availableBoxes}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Monthly Revenue</h3>
          <div className="text-2xl font-bold text-blue-600">€{totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Add Box Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Storage Box</h2>
            <form onSubmit={addStorageBox}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newBox.location}
                  onChange={(e) => setNewBox({ ...newBox, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                <select
                  value={newBox.size}
                  onChange={(e) => setNewBox({ ...newBox, size: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                  <option value="EXTRA_LARGE">Extra Large</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price per Day (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBox.pricePerDay}
                  onChange={(e) => setNewBox({ ...newBox, pricePerDay: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newBox.description}
                  onChange={(e) => setNewBox({ ...newBox, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Box
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Boxes</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
              </select>
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by location or size..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Storage Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBoxes.map((box) => (
          <div key={box.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{box.location}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSizeColor(box.size)}`}>
                  {box.size}
                </span>
              </div>
              <div className="flex space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  box.isOccupied 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {box.isOccupied ? 'Occupied' : 'Available'}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Price:</span> €{box.pricePerDay.toFixed(2)}/day
              </div>
              {box.description && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Description:</span> {box.description}
                </div>
              )}
            </div>

            {box.isOccupied && box.rentals.length > 0 && (
              <div className="border-t pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Current Rental</h4>
                {box.rentals
                  .filter(rental => rental.isActive)
                  .map(rental => (
                    <div key={rental.id} className="text-sm text-gray-600">
                      <div>Renter: {rental.user.firstName} {rental.user.lastName}</div>
                      <div>Until: {new Date(rental.endDate || '').toLocaleDateString()}</div>
                      <div>Access Code: {rental.accessCode}</div>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <Link 
                href={`/storage-boxes/${box.id}`}
                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
              >
                View Details
              </Link>
              <button
                onClick={() => deleteStorageBox(box.id)}
                className="text-red-600 hover:text-red-900 text-sm font-medium"
                disabled={box.isOccupied}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBoxes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No storage boxes found matching your criteria.</div>
        </div>
      )}
    </div>
  );
} 