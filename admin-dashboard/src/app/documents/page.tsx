'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Document {
  id: string;
  type: 'CONTRACT' | 'INVOICE' | 'RECEIPT' | 'REPORT' | 'OTHER';
  title: string;
  description: string | null;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  isPublic: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    name: string | null;
    userType: 'INDIVIDUAL' | 'PROFESSIONAL';
    companyName: string | null;
  };
  contract: {
    id: string;
    title: string;
    status: string;
  } | null;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      
      const response = await fetch(`/api/documents?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      
      const data = await response.json();
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDocuments();
        alert('Document supprimé avec succès');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CONTRACT': return 'bg-blue-100 text-blue-800';
      case 'INVOICE': return 'bg-green-100 text-green-800';
      case 'RECEIPT': return 'bg-yellow-100 text-yellow-800';
      case 'REPORT': return 'bg-purple-100 text-purple-800';
      case 'OTHER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (user: any) => {
    if (user.companyName) return user.companyName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.name || user.email;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(document => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      document.title.toLowerCase().includes(searchLower) ||
      document.fileName.toLowerCase().includes(searchLower) ||
      getUserName(document.user).toLowerCase().includes(searchLower) ||
      (document.contract?.title || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="text-sm text-gray-600">
          Total: {documents.length} documents
        </div>
      </div>
      
      {/* Filters */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-64">
            <label className="block mb-1 text-sm font-medium text-gray-700">Recherche</label>
            <input 
              type="text" 
              placeholder="Rechercher par titre, fichier ou utilisateur"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block mb-1 text-sm font-medium text-gray-700">Type</label>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les types</option>
              <option value="CONTRACT">Contrats</option>
              <option value="INVOICE">Factures</option>
              <option value="RECEIPT">Reçus</option>
              <option value="REPORT">Rapports</option>
              <option value="OTHER">Autres</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchDocuments}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des documents...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Documents Table */}
      {!loading && !error && (
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Document
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Utilisateur
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Contrat lié
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Taille
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucun document trouvé
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((document) => (
                  <tr key={document.id} className="text-sm text-gray-600">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{document.title}</div>
                        <div className="text-xs text-gray-500">{document.fileName}</div>
                        {document.description && (
                          <div className="text-xs text-gray-400 mt-1">{document.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{getUserName(document.user)}</div>
                        <div className="text-xs text-gray-500">{document.user.email}</div>
                        <div className="text-xs text-blue-600 font-medium">
                          {document.user.userType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(document.type)}`}>
                        {document.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {document.contract ? (
                        <div>
                          <div className="font-medium text-gray-900">{document.contract.title}</div>
                          <div className="text-xs text-gray-500">ID: {document.contract.id.substring(0, 8)}...</div>
                          <div className="text-xs text-green-600">{document.contract.status}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Aucun contrat</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{formatFileSize(document.fileSize)}</div>
                        <div className="text-xs text-gray-500">{document.mimeType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs">
                        <div>{format(new Date(document.createdAt), 'dd/MM/yyyy')}</div>
                        <div className="text-gray-500">{format(new Date(document.createdAt), 'HH:mm')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <a
                          href={document.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          📄 Télécharger
                        </a>
                        <a
                          href={document.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900 text-xs"
                        >
                          👁️ Voir
                        </a>
                        <button
                          onClick={() => deleteDocument(document.id)}
                          className="text-red-600 hover:text-red-900 text-xs text-left"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Summary */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{filteredDocuments.length}</span> sur <span className="font-medium">{documents.length}</span> documents
            </div>
            <div className="text-sm text-gray-500">
              Taille totale: {formatFileSize(documents.reduce((total, doc) => total + doc.fileSize, 0))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 