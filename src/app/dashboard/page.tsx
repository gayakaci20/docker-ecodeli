import { Suspense } from 'react';
import Loading from './loading';
import DashboardDataContent from './DashboardDataContent';
import DashboardStatsContent from './DashboardStatsContent';
import ConfirmedMatchesContent from './ConfirmedMatchesContent';

export const metadata = {
  title: 'Dashboard - EcoDeli',
  description: 'Tableau de bord de la plateforme de livraison écologique',
};

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Tableau de Bord</h1>
        <p className="text-gray-600">Bienvenue sur votre tableau de bord</p>
      </div>

      <Suspense fallback={<Loading />}>
        <DashboardStatsContent />
      </Suspense>

      <Suspense fallback={<Loading />}>
        <ConfirmedMatchesContent />
      </Suspense>

      <Suspense fallback={<Loading />}>
        <DashboardDataContent />
      </Suspense>
    </div>
  );
} 