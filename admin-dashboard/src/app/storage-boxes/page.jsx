'use client';

import { useState, useEffect } from 'react';

export default function StorageBoxesPage() {
  const [storageBoxes, setStorageBoxes] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [activeTab, setActiveTab] = useState('boxes');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    size: 'SMALL',
    pricePerDay: '',
    features: [],
    accessCode: ''
  });

  useEffect(() => {
    fetchStorageBoxes();
    fetchRentals();
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
      setIsLoading(false);
    }
  };

  const fetchRentals = async () => {
    try {
      const response = await fetch('/api/box-rentals');
      if (response.ok) {
        const data = await response.json();
        setRentals(data);
      }
    } catch (error) {
      console.error('Error fetching rentals:', error);
    }
  };

  const handleCreateBox = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/storage-boxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          pricePerDay: parseFloat(formData.pricePerDay),
          features: formData.features.filter(f => f.trim() !== '')
        }),
      });

      if (response.ok) {
        await fetchStorageBoxes();
        setShowCreateModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.message || 'Error creating storage box');
      }
    } catch (error) {
      console.error('Error creating storage box:', error);
      alert('Error creating storage box');
    }
  };

  const handleUpdateBox = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/storage-boxes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedBox.id,
          ...formData,
          pricePerDay: parseFloat(formData.pricePerDay),
          features: formData.features.filter(f => f.trim() !== '')
        }),
      });

      if (response.ok) {
        await fetchStorageBoxes();
        setShowEditModal(false);
        setSelectedBox(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.message || 'Error updating storage box');
      }
    } catch (error) {
      console.error('Error updating storage box:', error);
      alert('Error updating storage box');
    }
  };

  const handleDeleteBox = async (boxId) => {
    if (!confirm('Are you sure you want to delete this storage box?')) return;

    try {
      const response = await fetch(`/api/storage-boxes?id=${boxId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchStorageBoxes();
      } else {
        const error = await response.json();
        alert(error.message || 'Error deleting storage box');
      }
    } catch (error) {
      console.error('Error deleting storage box:', error);
      alert('Error deleting storage box');
    }
  };

  const handleUpdateRental = async (rentalId, status) => {
    try {
      const response = await fetch('/api/box-rentals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: rentalId,
          status
        }),
      });

      if (response.ok) {
        await fetchRentals();
        await fetchStorageBoxes();
      } else {
        const error = await response.json();
        alert(error.message || 'Error updating rental');
      }
    } catch (error) {
      console.error('Error updating rental:', error);
      alert('Error updating rental');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      size: 'SMALL',
      pricePerDay: '',
      features: [],
      accessCode: ''
    });
  };

  const openEditModal = (box) => {
    setSelectedBox(box);
    setFormData({
      name: box.name,
      description: box.description || '',
      location: box.location,
      size: box.size,
      pricePerDay: box.pricePerDay.toString(),
      features: box.features || [],
      accessCode: box.accessCode || ''
    });
    setShowEditModal(true);
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'RENTED': return 'bg-blue-100 text-blue-800';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRentalStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Storage Box Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Storage Box
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('boxes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'boxes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Storage Boxes ({storageBoxes.length})
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rentals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rentals ({rentals.length})
          </button>
        </nav>
      </div>

      {/* Storage Boxes Tab */}
      {activeTab === 'boxes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storageBoxes.map((box) => (
            <div key={box.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{box.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(box.status)}`}>
                  {box.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Location:</span> {box.location}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Size:</span> {box.size}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Price:</span> €{box.pricePerDay}/day
                </p>
                {box.description && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Description:</span> {box.description}
                  </p>
                )}
                {box.features && box.features.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Features:</span>
                    <ul className="list-disc list-inside ml-2">
                      {box.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {box.currentRental && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    <span className="font-medium">Current Renter:</span> {box.currentRental.user.firstName} {box.currentRental.user.lastName}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(box)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteBox(box.id)}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                  disabled={box.status === 'RENTED'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rentals Tab */}
      {activeTab === 'rentals' && (
        <div className="space-y-4">
          {rentals.map((rental) => (
            <div key={rental.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {rental.storageBox.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Renter: {rental.user.firstName} {rental.user.lastName} ({rental.user.email})
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRentalStatusColor(rental.status)}`}>
                  {rental.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Date</p>
                  <p className="text-sm text-gray-900">{new Date(rental.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p className="text-sm text-gray-900">
                    {rental.endDate ? new Date(rental.endDate).toLocaleDateString() : 'Open-ended'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-sm text-gray-900">{rental.days} days</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cost</p>
                  <p className="text-sm text-gray-900">€{rental.totalCost}</p>
                </div>
              </div>

              {rental.notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600">Notes</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{rental.notes}</p>
                </div>
              )}

              <div className="flex space-x-2">
                {rental.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleUpdateRental(rental.id, 'ACTIVE')}
                      className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateRental(rental.id, 'CANCELLED')}
                      className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
                {rental.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleUpdateRental(rental.id, 'COMPLETED')}
                    className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Storage Box</h3>
            <form onSubmit={handleCreateBox} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Size</label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                  <option value="EXTRA_LARGE">Extra Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price per Day (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerDay: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Access Code</label>
                <input
                  type="text"
                  value={formData.accessCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessCode: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Features</label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex mt-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Feature description"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="ml-2 bg-red-600 text-white px-2 py-2 rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="mt-2 bg-gray-600 text-white px-3 py-2 rounded text-sm"
                >
                  Add Feature
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBox && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Storage Box</h3>
            <form onSubmit={handleUpdateBox} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Size</label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                  <option value="EXTRA_LARGE">Extra Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price per Day (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerDay: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={selectedBox.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RENTED">Rented</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Access Code</label>
                <input
                  type="text"
                  value={formData.accessCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessCode: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedBox(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 