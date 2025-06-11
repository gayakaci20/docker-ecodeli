import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head';
import { PrismaClient } from '@prisma/client';

export default function AdminDashboard({ stats }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (user.role !== 'ADMIN') {
        router.push('/');
        return;
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Head>
          <title>Dashboard Admin - ecodeli</title>
        </Head>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 rounded-full animate-spin border-sky-500"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Dashboard Admin - ecodeli</title>
      </Head>
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Bienvenue, {user.name}</span>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-white rounded-md bg-sky-500 hover:bg-sky-600"
              >
                Retour au site
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-2 text-sm font-medium text-gray-500 uppercase">Utilisateurs</h3>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-gray-900">{stats.users}</div>
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">
                Total
              </span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-2 text-sm font-medium text-gray-500 uppercase">Colis</h3>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-gray-900">{stats.packages}</div>
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full">
                Total
              </span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-2 text-sm font-medium text-gray-500 uppercase">Trajets</h3>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-gray-900">{stats.rides}</div>
              <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full">
                Total
              </span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-2 text-sm font-medium text-gray-500 uppercase">Correspondances</h3>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-gray-900">{stats.matches}</div>
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full">
                Total
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-medium">Actions rapides</h3>
            <div className="space-y-3">
              <button 
                onClick={() => window.open('http://localhost:3001', '_blank')}
                className="w-full px-4 py-2 text-left transition-colors rounded-md bg-sky-50 hover:bg-sky-100"
              >
                🚀 Ouvrir le Dashboard Admin complet
              </button>
              <button 
                onClick={() => window.open('http://localhost:5555', '_blank')}
                className="w-full px-4 py-2 text-left transition-colors rounded-md bg-green-50 hover:bg-green-100"
              >
                🗄️ Ouvrir Prisma Studio
              </button>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-medium">Statistiques récentes</h3>
            <div className="py-4 text-center text-gray-500">
              Aucune activité récente
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-4 text-lg font-medium">Alertes système</h3>
            <div className="py-4 text-center text-gray-500">
              Tout fonctionne normalement
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Récupérer les statistiques côté serveur
export async function getServerSideProps() {
  const prisma = new PrismaClient();
  
  try {
    const [users, packages, rides, matches] = await Promise.all([
      prisma.user.count(),
      prisma.package.count(),
      prisma.ride.count(),
      prisma.match.count(),
    ]);

    return {
      props: {
        stats: {
          users,
          packages,
          rides,
          matches,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      props: {
        stats: {
          users: 0,
          packages: 0,
          rides: 0,
          matches: 0,
        },
      },
    };
  } finally {
    await prisma.$disconnect();
  }
} 