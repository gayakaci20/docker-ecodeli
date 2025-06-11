import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function TestSolutions() {
  const [test, setTest] = useState('Hello from test solutions!');

  return (
    <>
      <Head>
        <title>Test Solutions - EcoDeli</title>
      </Head>

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Retour à l'accueil
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Test de la page Solutions
          </h1>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-gray-600 mb-4">{test}</p>
            
            <button 
              onClick={() => setTest('React fonctionne !')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test React State
            </button>
            
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Catégories de services :</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['CLEANING', 'MAINTENANCE', 'DELIVERY', 'INSTALLATION', 'REPAIR', 'CONSULTATION'].map((cat) => (
                  <div key={cat} className="bg-blue-50 p-3 rounded border">
                    <span className="text-sm font-medium text-blue-800">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 