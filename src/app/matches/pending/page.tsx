import { Suspense } from 'react';
import PendingMatchesContent from '../PendingMatchesContent';

export const metadata = {
  title: 'Demandes en Attente - EcoDeli',
  description: 'Gérez vos demandes de transport',
};

export default function PendingMatchesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Demandes en Attente</h1>
          <p className="text-gray-600 mt-2">
            Examinez et répondez aux demandes de transport pour vos colis
          </p>
        </div>

        <Suspense fallback={
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des demandes...</p>
          </div>
        }>
          <PendingMatchesContent />
        </Suspense>
      </div>
    </div>
  );
} 