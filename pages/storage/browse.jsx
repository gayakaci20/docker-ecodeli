import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function BrowseStorage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [storageBoxes, setStorageBoxes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [sortBy, setSortBy] = useState('pricePerDay');

  useEffect(() => {
    fetchStorageBoxes();
  }, [selectedLocation, selectedSize, sortBy]);

  const fetchStorageBoxes = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        sortBy: sortBy
      });

      if (selectedLocation !== 'all') {
        params.append('location', selectedLocation);
      }

      if (selectedSize !== 'all') {
        params.append('size', selectedSize);
      }

      // Only show available boxes
      params.append('available', 'true');

      const response = await fetch(`/api/storage-boxes?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch storage boxes');
      }

      const data = await response.json();
      setStorageBoxes(data.storageBoxes || data);

    } catch (error) {
      console.error('Error fetching storage boxes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRentBox = async (boxId) => {
    if (!user) {
      router.push('/login');
      return;
    }

    router.push(`/storage/rent/${boxId}`);
  };

  const getSizeColor = (size) => {
    switch (size) {
      case 'SMALL':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LARGE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSizeDescription = (size) => {
    switch (size) {
      case 'SMALL':
        return '30cm x 30cm x 30cm - Perfect for documents, small packages';
      case 'MEDIUM':
        return '50cm x 50cm x 50cm - Ideal for clothing, electronics';
      case 'LARGE':
        return '80cm x 80cm x 80cm - Great for large items, multiple packages';
      default:
        return 'Size details unavailable';
    }
  };

  // Get unique locations and sizes for filters
  const locations = [...new Set(storageBoxes.map(box => box.location))];
  const sizes = ['SMALL', 'MEDIUM', 'LARGE'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Storage Boxes</h1>
              <p className="text-gray-600">Secure temporary storage solutions</p>
            </div>
            {user && (
              <button
                onClick={() => router.push('/storage/my-rentals')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                My Rentals
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                id="location"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                id="size"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sizes</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pricePerDay">Price (Low to High)</option>
                <option value="-pricePerDay">Price (High to Low)</option>
                <option value="size">Size</option>
                <option value="location">Location</option>
              </select>
            </div>
          </div>
        </div>

        {/* Storage Boxes Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : storageBoxes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No storage boxes available</p>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storageBoxes.map((box) => (
              <div key={box.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Box #{box.code}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSizeColor(box.size)}`}>
                        {box.size}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        €{box.pricePerDay}
                      </div>
                      <div className="text-sm text-gray-500">per day</div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {box.location}
                    </div>

                    <div className="flex items-start text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <div>
                        <div className="font-medium">{box.size} Size</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getSizeDescription(box.size)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-600 font-medium">Available</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 24/7 secure access</li>
                      <li>• Climate controlled</li>
                      <li>• Digital lock system</li>
                      <li>• Insurance included</li>
                    </ul>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => router.push(`/storage/view/${box.id}`)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleRentBox(box.id)}
                      disabled={box.isOccupied || !box.isActive}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {box.isOccupied ? 'Occupied' : !box.isActive ? 'Unavailable' : 'Rent Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">How Storage Boxes Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-blue-800">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium mb-2">Choose Your Box</h4>
              <p className="text-sm">Select the perfect size and location for your storage needs</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium mb-2">Secure Payment</h4>
              <p className="text-sm">Pay securely online and receive your unique access code</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium mb-2">Store & Access</h4>
              <p className="text-sm">Use your access code to store items and retrieve them anytime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 