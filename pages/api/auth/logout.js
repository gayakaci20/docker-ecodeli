/**
 * API endpoint pour gérer la déconnexion
 * Supprime le cookie d'authentification
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Pour le logout, on n'a pas grand chose à faire côté serveur
    // puisque les JWT sont stateless. Le client supprimera le token.
    
    res.status(200).json({ message: 'Déconnexion réussie' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}