import Image from "next/image";
import { BookingStatus, ContractStatus } from '@/generated/prisma';
import { format } from 'date-fns';
import Link from "next/link";
import { Poppins } from 'next/font/google';
import { prisma } from '@/lib/prisma';

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
})

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';

async function fetchDashboardData() {
  try {
    // Appel direct à Prisma au lieu de fetch pour éviter les problèmes SSR
    const [
      users,
      packages,
      rides,
      matches,
      payments,
      messages,
      notifications
    ] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          address: true,
          role: true,
          isVerified: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          image: true,
        },
      }),
      prisma.package.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          matches: {
            include: {
              ride: true,
            },
          },
        },
      }),
      prisma.ride.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          matches: {
            include: {
              package: true,
            },
          },
        },
      }),
      prisma.match.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          package: {
            include: {
              user: true,
            },
          },
          ride: {
            include: {
              user: true,
            },
          },
          payment: true,
        },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          match: {
            include: {
              package: true,
              ride: true,
            },
          },
        },
      }),
      prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      users,
      packages,
      rides,
      matches,
      payments,
      messages,
      notifications,
    };
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return {
      users: [],
      packages: [],
      rides: [],
      matches: [],
      payments: [],
      messages: [],
      notifications: []
    };
  }
}

export default async function Home() {
  const dashboardData = await fetchDashboardData();
  const { 
    users = [], 
    packages = [], 
    rides = [], 
    matches = [], 
    payments = []
  } = dashboardData;

  // Mock data for features not yet implemented in API
  const services: any[] = [];
  const bookings: any[] = [];
  const contracts: any[] = [];
  const storageBoxes: any[] = [];
  const boxRentals: any[] = [];
  const documents: any[] = [];

  // Calculate metrics
  const totalRevenue = payments
    .filter((p: any) => p.status === 'COMPLETED')
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  const activeBookingStatuses: BookingStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'];
  const activeBookings = 0; // bookings.filter(b => activeBookingStatuses.includes(b.status)).length;
  const completedBookings = 0; // bookings.filter(b => b.status === 'COMPLETED').length;
  const activeContracts = 0; // contracts.filter(c => c.status === 'SIGNED').length;
  const occupiedBoxes = 0; // storageBoxes.filter(b => b.isOccupied).length;

  // User role distribution
  const usersByRole = users.reduce((acc: Record<string, number>, user: any) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your EcoDeli platform</p>
      </div>
      
      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-gray-500 text-sm font-medium uppercase mb-2">Total Users</h2>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-gray-900">{users.length}</div>
            <Link href="/users" className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full hover:bg-blue-200 transition-colors">
              View All
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-gray-500 text-sm font-medium uppercase mb-2">Active Services</h2>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-green-600">{services.filter(s => s.isActive).length}</div>
            <Link href="/services" className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full hover:bg-green-200 transition-colors">
              Manage
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-gray-500 text-sm font-medium uppercase mb-2">Total Revenue</h2>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-purple-600">€{totalRevenue.toFixed(2)}</div>
            <Link href="/payments" className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full hover:bg-purple-200 transition-colors">
              Details
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-gray-500 text-sm font-medium uppercase mb-2">Active Bookings</h2>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-orange-600">{activeBookings}</div>
            <Link href="/bookings" className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full hover:bg-orange-200 transition-colors">
              View
            </Link>
          </div>
        </div>
      </div>
      
      {/* Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Packages</h3>
          <div className="text-2xl font-bold text-gray-900">{packages.length}</div>
          <p className="text-xs text-gray-500 mt-1">Total packages</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Rides</h3>
          <div className="text-2xl font-bold text-gray-900">{rides.length}</div>
          <p className="text-xs text-gray-500 mt-1">Available rides</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Contracts</h3>
          <div className="text-2xl font-bold text-gray-900">{activeContracts}</div>
          <p className="text-xs text-gray-500 mt-1">Active contracts</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Storage Boxes</h3>
          <div className="text-2xl font-bold text-gray-900">{occupiedBoxes}/{storageBoxes.length}</div>
          <p className="text-xs text-gray-500 mt-1">Occupied/Total</p>
            </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Documents</h3>
          <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
          <p className="text-xs text-gray-500 mt-1">Generated docs</p>
        </div>
      </div>
      
      {/* User Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">User Distribution by Role</h2>
          <div className="space-y-3">
            {Object.entries(usersByRole).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {role.toLowerCase().replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${((count as number) / users.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Recent Activity</h2>
          <div className="space-y-3">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{booking.service.name}</p>
                  <p className="text-xs text-gray-500">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                  booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
            {bookings.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent bookings</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link href="/users" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="w-8 h-8 bg-blue-600 rounded-full mb-2"></div>
            <span className="text-sm font-medium text-blue-900">Manage Users</span>
          </Link>
          
          <Link href="/services" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <div className="w-8 h-8 bg-green-600 rounded-full mb-2"></div>
            <span className="text-sm font-medium text-green-900">Services</span>
          </Link>
          
          <Link href="/bookings" className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <div className="w-8 h-8 bg-orange-600 rounded-full mb-2"></div>
            <span className="text-sm font-medium text-orange-900">Bookings</span>
          </Link>
          
          <Link href="/contracts" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <div className="w-8 h-8 bg-purple-600 rounded-full mb-2"></div>
            <span className="text-sm font-medium text-purple-900">Contracts</span>
          </Link>
          
          <Link href="/storage-boxes" className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
            <div className="w-8 h-8 bg-indigo-600 rounded-full mb-2"></div>
            <span className="text-sm font-medium text-indigo-900">Storage</span>
          </Link>
          
          <Link href="/analytics" className="flex flex-col items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
            <div className="w-8 h-8 bg-pink-600 rounded-full mb-2"></div>
            <span className="text-sm font-medium text-pink-900">Analytics</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
