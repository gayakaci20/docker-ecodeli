'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Contract {
  id: string;
  title: string;
  description: string | null;
  terms: string;
  value: number | null;
  currency: string;
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  startDate: string | null;
  endDate: string | null;
  signedDate: string | null;
  createdAt: string;
  merchant: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    name: string | null;
    userType: 'INDIVIDUAL' | 'PROFESSIONAL';
    companyName: string | null;
    companyFirstName: string | null;
    companyLastName: string | null;
    address: string | null;
    phoneNumber: string | null;
  };
  documents: Array<{
    id: string;
    type: string;
    title: string;
    fileName: string;
    filePath: string;
    createdAt: string;
  }>;
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  name: string | null;
  userType: 'INDIVIDUAL' | 'PROFESSIONAL';
  companyName: string | null;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form state for creating contracts
  const [formData, setFormData] = useState({
    merchantId: '',
    title: '',
    description: '',
    terms: '',
    value: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchContracts();
    fetchProfessionalUsers();
  }, [statusFilter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/contracts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      
      const data = await response.json();
      setContracts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionalUsers = async () => {
    try {
      const response = await fetch('/api/users?userType=PROFESSIONAL');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching professional users:', error);
    }
  };

  const createContract = async () => {
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          value: formData.value ? parseFloat(formData.value) : null
        }),
      });

      if (response.ok) {
        fetchContracts();
        setShowCreateModal(false);
        setFormData({
          merchantId: '',
          title: '',
          description: '',
          terms: '',
          value: '',
          startDate: '',
          endDate: ''
        });
        alert('Contrat créé avec succès');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la création du contrat');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Erreur lors de la création du contrat');
    }
  };

  const updateContractStatus = async (contractId: string, newStatus: string) => {
    try {
      const updateData: any = { id: contractId, status: newStatus };
      
      if (newStatus === 'SIGNED') {
        updateData.signedDate = new Date().toISOString();
      }

      const response = await fetch('/api/contracts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        fetchContracts();
        alert(`Statut du contrat mis à jour: ${newStatus}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const generatePDF = async (contractId: string) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          type: 'CONTRACT'
        }),
      });

      if (response.ok) {
        const document = await response.json();
        fetchContracts(); // Refresh to show new document
        alert('PDF généré avec succès');
        
        // Open PDF in new tab
        window.open(document.filePath, '_blank');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la génération du PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const deleteContract = async (contractId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) return;

    try {
      const response = await fetch(`/api/contracts?id=${contractId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchContracts();
        alert('Contrat supprimé avec succès');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PENDING_SIGNATURE': return 'bg-yellow-100 text-yellow-800';
      case 'SIGNED': return 'bg-blue-100 text-blue-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'TERMINATED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (user: any) => {
    if (user.companyName) return user.companyName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.name || user.email;
  };

  const filteredContracts = contracts.filter(contract => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      contract.title.toLowerCase().includes(searchLower) ||
      contract.id.toLowerCase().includes(searchLower) ||
      getUserName(contract.merchant).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contrats</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Nouveau Contrat
        </button>
      </div>
      
      {/* Filters */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-64">
            <label className="block mb-1 text-sm font-medium text-gray-700">Recherche</label>
            <input 
              type="text" 
              placeholder="Rechercher par titre, ID ou client"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block mb-1 text-sm font-medium text-gray-700">Statut</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PENDING_SIGNATURE">En attente de signature</option>
              <option value="SIGNED">Signé</option>
              <option value="ACTIVE">Actif</option>
              <option value="EXPIRED">Expiré</option>
              <option value="TERMINATED">Résilié</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchContracts}
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
          <p className="mt-4 text-gray-600">Chargement des contrats...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Contracts Table */}
      {!loading && !error && (
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Contrat
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Client (Professionnel)
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Valeur
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Dates
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Documents
                </th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucun contrat trouvé
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="text-sm text-gray-600">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{contract.title}</div>
                        <div className="text-xs text-gray-500">ID: {contract.id.substring(0, 8)}...</div>
                        <div className="text-xs text-gray-400">
                          Créé le {format(new Date(contract.createdAt), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{getUserName(contract.merchant)}</div>
                        <div className="text-xs text-gray-500">{contract.merchant.email}</div>
                        <div className="text-xs text-blue-600 font-medium">
                          {contract.merchant.userType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contract.value ? (
                        <span className="font-medium">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: contract.currency
                          }).format(contract.value)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Non définie</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        {contract.startDate && (
                          <div><strong>Début:</strong> {format(new Date(contract.startDate), 'dd/MM/yyyy')}</div>
                        )}
                        {contract.endDate && (
                          <div><strong>Fin:</strong> {format(new Date(contract.endDate), 'dd/MM/yyyy')}</div>
                        )}
                        {contract.signedDate && (
                          <div><strong>Signé:</strong> {format(new Date(contract.signedDate), 'dd/MM/yyyy')}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        {contract.documents.length === 0 ? (
                          <span className="text-gray-400">Aucun document</span>
                        ) : (
                          <div>
                            <div className="font-medium">{contract.documents.length} document(s)</div>
                            {contract.documents.slice(0, 2).map(doc => (
                              <div key={doc.id} className="text-blue-600">
                                <a href={doc.filePath} target="_blank" rel="noopener noreferrer">
                                  📄 {doc.type}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          Détails
                        </button>
                        
                        {contract.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => updateContractStatus(contract.id, 'PENDING_SIGNATURE')}
                              className="text-yellow-600 hover:text-yellow-900 text-xs"
                            >
                              → En attente
                            </button>
                            <button
                              onClick={() => deleteContract(contract.id)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                        
                        {contract.status === 'PENDING_SIGNATURE' && (
                          <button
                            onClick={() => updateContractStatus(contract.id, 'SIGNED')}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            Marquer signé
                          </button>
                        )}
                        
                        {(contract.status === 'SIGNED' || contract.status === 'ACTIVE') && (
                          <button
                            onClick={() => updateContractStatus(contract.id, 'ACTIVE')}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            Activer
                          </button>
                        )}
                        
                        {contract.merchant.userType === 'PROFESSIONAL' && (
                          <button
                            onClick={() => generatePDF(contract.id)}
                            className="text-purple-600 hover:text-purple-900 text-xs"
                          >
                            📄 Générer PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{filteredContracts.length}</span> sur <span className="font-medium">{contracts.length}</span> contrats
            </div>
          </div>
        </div>
      )}

      {/* Create Contract Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nouveau Contrat</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Professionnel</label>
                  <select
                    value={formData.merchantId}
                    onChange={(e) => setFormData({...formData, merchantId: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {getUserName(user)} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Titre</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Conditions</label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({...formData, terms: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Valeur (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de début</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={createContract}
                  className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      {showDetailsModal && selectedContract && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Détails du Contrat</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informations générales</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Titre:</strong> {selectedContract.title}</div>
                    <div><strong>ID:</strong> {selectedContract.id}</div>
                    <div><strong>Statut:</strong> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedContract.status)}`}>
                        {selectedContract.status}
                      </span>
                    </div>
                    <div><strong>Valeur:</strong> {selectedContract.value ? 
                      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: selectedContract.currency }).format(selectedContract.value) 
                      : 'Non définie'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Client</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nom:</strong> {getUserName(selectedContract.merchant)}</div>
                    <div><strong>Email:</strong> {selectedContract.merchant.email}</div>
                    <div><strong>Type:</strong> {selectedContract.merchant.userType}</div>
                    {selectedContract.merchant.phoneNumber && (
                      <div><strong>Téléphone:</strong> {selectedContract.merchant.phoneNumber}</div>
                    )}
                  </div>
                </div>
              </div>

              {selectedContract.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedContract.description}</p>
                </div>
              )}

              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Conditions</h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {selectedContract.terms}
                </div>
              </div>

              {selectedContract.documents.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
                  <div className="space-y-2">
                    {selectedContract.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{doc.title}</span>
                        <a 
                          href={doc.filePath} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          📄 Télécharger
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 