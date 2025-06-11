import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DebugAuth() {
  const { user, loading, isAuthenticated } = useAuth();
  const [cookieInfo, setCookieInfo] = useState('');
  const [apiResponse, setApiResponse] = useState('');

  useEffect(() => {
    // Get cookie info from browser
    const cookies = document.cookie;
    setCookieInfo(cookies);
  }, []);

  const testAuthAPI = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      
      const result = await response.json();
      setApiResponse(`Status: ${response.status}\nResponse: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setApiResponse(`Error: ${error.message}`);
    }
  };

  const clearCookies = () => {
    document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Authentication</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Context Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth Context</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
              <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'true' : 'false'}</p>
              <p><strong>User:</strong></p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {user ? JSON.stringify(user, null, 2) : 'null'}
              </pre>
            </div>
          </div>

          {/* Cookies Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cookies</h2>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto whitespace-pre-wrap">
              {cookieInfo || 'No cookies found'}
            </pre>
          </div>

          {/* API Test */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">API Test</h2>
            <div className="space-y-4">
              <button
                onClick={testAuthAPI}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Test /api/auth/me
              </button>
              
              <button
                onClick={clearCookies}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-4"
              >
                Clear Cookies & Reload
              </button>

              {apiResponse && (
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
                  {apiResponse}
                </pre>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4">
              <a 
                href="/login" 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
              >
                Go to Login
              </a>
              <a 
                href="/profile" 
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 inline-block"
              >
                Go to Profile
              </a>
              <a 
                href="/dashboard" 
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 inline-block"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 