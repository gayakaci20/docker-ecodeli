import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import Header from '../../components/Header'
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle,
  ArrowLeft,
  Phone,
  Mail,
  User
} from 'lucide-react'

export default function PackageTrack({ isDarkMode, toggleDarkMode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = router.query
  
  const [packageData, setPackageData] = useState(null)
  const [trackingHistory, setTrackingHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchPackageDetails()
    }
  }, [id])

  const fetchPackageDetails = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/packages/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch package details')
      }

      const data = await response.json()
      setPackageData(data)
      
      // Generate tracking history based on status
      generateTrackingHistory(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const generateTrackingHistory = (pkg) => {
    const history = []
    const now = new Date()
    
    // Always add package created
    history.push({
      status: 'CREATED',
      title: 'Package Created',
      description: 'Your package has been registered in our system',
      timestamp: pkg.createdAt,
      completed: true,
      icon: Package
    })

    // Add status-based history
    if (pkg.status === 'PENDING') {
      history.push({
        status: 'PENDING',
        title: 'Awaiting Carrier',
        description: 'Looking for a carrier to transport your package',
        timestamp: pkg.createdAt,
        completed: false,
        icon: Clock
      })
    }

    if (['MATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(pkg.status)) {
      history.push({
        status: 'MATCHED',
        title: 'Carrier Found',
        description: 'A carrier has been assigned to your package',
        timestamp: pkg.updatedAt,
        completed: true,
        icon: User
      })
    }

    if (['IN_TRANSIT', 'DELIVERED'].includes(pkg.status)) {
      history.push({
        status: 'IN_TRANSIT',
        title: 'In Transit',
        description: 'Your package is on its way to the destination',
        timestamp: pkg.updatedAt,
        completed: true,
        icon: Truck
      })
    }

    if (pkg.status === 'DELIVERED') {
      history.push({
        status: 'DELIVERED',
        title: 'Delivered',
        description: 'Your package has been successfully delivered',
        timestamp: pkg.updatedAt,
        completed: true,
        icon: CheckCircle
      })
    }

    if (pkg.status === 'CANCELLED') {
      history.push({
        status: 'CANCELLED',
        title: 'Cancelled',
        description: 'Package delivery has been cancelled',
        timestamp: pkg.updatedAt,
        completed: true,
        icon: AlertCircle
      })
    }

    setTrackingHistory(history)
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      MATCHED: 'bg-blue-100 text-blue-800 border-blue-200',
      IN_TRANSIT: 'bg-purple-100 text-purple-800 border-purple-200',
      DELIVERED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Track Package - EcoDeli</title>
        <meta name="description" content="Track your package delivery status" />
      </Head>

      <Header 
        user={user} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/dashboard/customer"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading package details...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {packageData && (
          <div className="space-y-6">
            {/* Package Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {packageData.title}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Package ID: {packageData.id}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(packageData.status)}`}>
                  {packageData.status}
                </div>
              </div>

              {packageData.description && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {packageData.description}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-green-500" />
                    Pickup Location
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{packageData.pickupAddress}</p>
                  {packageData.pickupDate && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Scheduled: {formatDate(packageData.pickupDate)}
                    </p>
                  )}
                </div>

                {/* Delivery Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                    Delivery Location
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{packageData.deliveryAddress}</p>
                  {packageData.deliveryDate && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Expected: {formatDate(packageData.deliveryDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Package Details */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {packageData.weight && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Weight</p>
                      <p className="font-medium text-gray-900 dark:text-white">{packageData.weight} kg</p>
                    </div>
                  )}
                  {packageData.dimensions && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Dimensions</p>
                      <p className="font-medium text-gray-900 dark:text-white">{packageData.dimensions}</p>
                    </div>
                  )}
                  {packageData.price && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Price</p>
                      <p className="font-medium text-gray-900 dark:text-white">€{packageData.price}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Created</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(packageData.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Tracking Timeline
              </h2>
              
              <div className="space-y-6">
                {trackingHistory.map((event, index) => {
                  const IconComponent = event.icon
                  return (
                    <div key={index} className="flex items-start">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        event.completed 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-medium ${
                            event.completed 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-500 dark:text-gray-500'
                          }`}>
                            {event.title}
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-500">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          event.completed 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : 'text-gray-400 dark:text-gray-600'
                        }`}>
                          {event.description}
                        </p>
                      </div>
                      
                      {index < trackingHistory.length - 1 && (
                        <div className="absolute left-5 mt-10 w-0.5 h-6 bg-gray-200 dark:bg-gray-700"></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Contact Information */}
            {packageData.status === 'MATCHED' || packageData.status === 'IN_TRANSIT' ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Need Help?
                </h3>
                <p className="text-blue-700 dark:text-blue-300 mb-4">
                  Your package is being handled by our carrier. If you have any questions, you can contact our support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a 
                    href="tel:+33123456789"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Support
                  </a>
                  <a 
                    href="mailto:support@ecodeli.com"
                    className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Support
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
} 