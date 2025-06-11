import './globals.css'
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import Link from 'next/link'
const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
})
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EcoDeli Admin Dashboard',
  description: 'Admin dashboard for EcoDeli',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <div className="flex h-screen bg-gray-100">
          {/* Sidebar */}
          <div className="w-64 overflow-y-auto text-white bg-sky-700">
            <div className="p-4 mt-6 text-xl font-bold text-center">ecodeli Admin</div>
            <nav className="mt-6 space-y-1">
              {/* Core Management */}
              <div className="px-6 py-2 text-xs font-semibold tracking-wider uppercase text-sky-200">
                Core Management
              </div>
              <Link href="/" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Dashboard</Link>
              <Link href="/users" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Users</Link>
              <Link href="/packages" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Packages</Link>
              <Link href="/rides" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Rides</Link>
              <Link href="/matches" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Matches</Link>
              
              {/* Business Features */}
              <div className="px-6 py-2 mt-4 text-xs font-semibold tracking-wider uppercase text-sky-200">
                Business Features
              </div>
              <Link href="/services" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Services</Link>
              <Link href="/bookings" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Bookings</Link>
              <Link href="/contracts" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Contracts</Link>
              <Link href="/storage-boxes" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Storage Boxes</Link>
              <Link href="/box-rentals" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Box Rentals</Link>
              
              {/* Financial */}
              <div className="px-6 py-2 mt-4 text-xs font-semibold tracking-wider uppercase text-sky-200">
                Financial
              </div>
              <Link href="/payments" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Payments</Link>
              <Link href="/documents" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Documents</Link>
              <Link href="/analytics" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Analytics</Link>
              
              {/* Communication */}
              <div className="px-6 py-2 mt-4 text-xs font-semibold tracking-wider uppercase text-sky-200">
                Communication
              </div>
              <Link href="/messages" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Messages</Link>
              <Link href="/notifications" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Notifications</Link>
              
              {/* System */}
              <div className="px-6 py-2 mt-4 text-xs font-semibold tracking-wider uppercase text-sky-200">
                System
              </div>
              <Link href="/settings" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Settings</Link>
              <Link href="/logs" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">System Logs</Link>
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="p-6 bg-white rounded-lg shadow">
                {children}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
