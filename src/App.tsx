import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import AdminLogin from './components/AdminLogin';
import UserDashboard from './components/UserDashboard';
import NewAdminDashboard from './components/NewAdminDashboard';

type RouteContext = 'admin' | 'user';

function ProtectedRoute({
  children,
  requireAdmin = false,
  requiredContext
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredContext: RouteContext;
}) {
  const { user, loading, isAdmin, checkingAdmin, loginContext, signOut } = useAuth();

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return requiredContext === 'admin' ? <AdminLogin /> : <AuthPage />;
  }

  if (loginContext !== requiredContext) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-orange-100 rounded-full p-6 inline-block mb-4">
            <svg className="w-16 h-16 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Wrong Portal</h1>
          <p className="text-gray-600 mb-6">
            {requiredContext === 'admin'
              ? 'You are logged in as a user. Please log in through the Admin Portal to access this area.'
              : 'You are logged in as an admin. Please log in through the User Portal to access this area.'}
          </p>
          <button
            onClick={async () => {
              await signOut();
              window.location.href = requiredContext === 'admin' ? '/admin/login' : '/';
            }}
            className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-xl font-semibold hover:from-slate-700 hover:to-slate-900 transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Sign Out & Use {requiredContext === 'admin' ? 'Admin' : 'User'} Portal
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full p-6 inline-block mb-4">
            <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You do not have admin privileges. Only authorized administrators can access this area.</p>
          <button
            onClick={() => {
              window.location.href = '/admin/login';
            }}
            className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-xl font-semibold hover:from-slate-700 hover:to-slate-900 transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Back to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePathChange);

    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handlePathChange();
    };

    return () => {
      window.removeEventListener('popstate', handlePathChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  if (currentPath === '/admin/login') {
    return <AdminLogin />;
  }

  if (currentPath === '/admin') {
    return (
      <ProtectedRoute requireAdmin={true} requiredContext="admin">
        <NewAdminDashboard />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredContext="user">
      <UserDashboard />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
