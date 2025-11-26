import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-black text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-orange-500">PRIME</span>
              <span className="text-lg ml-1">ACADEMY</span>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link
                to="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
              >
                Dashboard
              </Link>
              {user?.role === 'faculty' && (
                <Link
                  to="/faculty/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
                >
                  Faculty Dashboard
                </Link>
              )}
              {(user?.role === 'admin' || user?.role === 'superadmin') && (
                <Link
                  to="/batches/create"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
                >
                  Create Batch
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">{user.name}</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-orange-500 text-white">
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

