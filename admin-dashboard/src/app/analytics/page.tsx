'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  users: {
    total: number;
    byRole: Record<string, number>;
    newThisMonth: number;
    growthRate: number;
  };
  services: {
    total: number;
    active: number;
    byCategory: Record<string, number>;
    averageRating: number;
  };
  bookings: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    thisMonth: number;
    revenue: number;
  };
  packages: {
    total: number;
    delivered: number;
    inTransit: number;
    pending: number;
  };
  storageBoxes: {
    total: number;
    occupied: number;
    revenue: number;
    occupancyRate: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    bySource: Record<string, number>;
  };
  matches: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    thisMonth: number;
  };
  rides: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    thisMonth: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-32 h-32 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="py-12 text-center">
        <div className="text-gray-500">Unable to load analytics data.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">Business insights and performance metrics</p>
        </div>
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-gray-500">Total Revenue</h3>
          <div className="text-3xl font-bold text-gray-900">€{analytics.revenue.total.toFixed(2)}</div>
          <div className={`text-sm mt-2 ${analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analytics.revenue.growth >= 0 ? '+' : ''}{analytics.revenue.growth.toFixed(1)}% from last month
          </div>
        </div>

        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-gray-500">Total Users</h3>
          <div className="text-3xl font-bold text-gray-900">{analytics.users.total}</div>
          <div className={`text-sm mt-2 ${analytics.users.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analytics.users.newThisMonth} new this month
          </div>
        </div>

        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-gray-500">Active Services</h3>
          <div className="text-3xl font-bold text-gray-900">{analytics.services.active}</div>
          <div className="mt-2 text-sm text-gray-500">
            Avg rating: {analytics.services.averageRating.toFixed(1)}/5
          </div>
        </div>

        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-gray-500">Bookings</h3>
          <div className="text-3xl font-bold text-gray-900">{analytics.bookings.thisMonth}</div>
          <div className="mt-2 text-sm text-gray-500">
            {analytics.bookings.completed} completed
          </div>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* User Distribution */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">User Distribution by Role</h2>
          <div className="space-y-4">
            {Object.entries(analytics.users.byRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {role.toLowerCase().replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-600 rounded-full" 
                      style={{ width: `${(count / analytics.users.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-sm font-bold text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Categories */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Services by Category</h2>
          <div className="space-y-4">
            {Object.entries(analytics.services.byCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {category.toLowerCase()}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-green-600 rounded-full" 
                      style={{ width: `${(count / analytics.services.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-sm font-bold text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue and Business Metrics */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
        {/* Revenue Sources */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Revenue by Source</h2>
          <div className="space-y-3">
            {Object.entries(analytics.revenue.bySource).map(([source, amount]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {source.replace('_', ' ')}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  €{amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Status */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Booking Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Completed</span>
              <span className="text-sm font-bold text-green-600">
                {analytics.bookings.completed}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Pending</span>
              <span className="text-sm font-bold text-yellow-600">
                {analytics.bookings.pending}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Cancelled</span>
              <span className="text-sm font-bold text-red-600">
                {analytics.bookings.cancelled}
              </span>
            </div>
          </div>
        </div>

        {/* Storage Box Metrics */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Storage Boxes</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Boxes</span>
              <span className="text-sm font-bold text-gray-900">
                {analytics.storageBoxes.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Occupied</span>
              <span className="text-sm font-bold text-blue-600">
                {analytics.storageBoxes.occupied}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Occupancy Rate</span>
              <span className="text-sm font-bold text-purple-600">
                {analytics.storageBoxes.occupancyRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Revenue</span>
              <span className="text-sm font-bold text-green-600">
                €{analytics.storageBoxes.revenue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Package Delivery Metrics */}
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Package Delivery Status</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{analytics.packages.total}</div>
            <div className="text-sm text-gray-500">Total Packages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.packages.delivered}</div>
            <div className="text-sm text-gray-500">Delivered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.packages.inTransit}</div>
            <div className="text-sm text-gray-500">In Transit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{analytics.packages.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
} 