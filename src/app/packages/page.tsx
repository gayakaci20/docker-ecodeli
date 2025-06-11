import { Suspense } from 'react';
import AvailablePackagesContent from './AvailablePackagesContent';

export const metadata = {
  title: 'Colis Disponibles - EcoDeli',
  description: 'Trouvez des colis à transporter',
};

export default function AvailablePackagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Colis Disponibles</h1>
          <p className="text-gray-600 mt-2">
            Trouvez des colis à transporter et proposez vos services
          </p>
        </div>

        <Suspense fallback={
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des colis...</p>
          </div>
        }>
          <AvailablePackagesContent />
        </Suspense>
      </div>
    </div>
  );
} 