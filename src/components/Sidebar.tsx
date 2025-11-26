import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  name: string;
  path: string;
  icon: string;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: '📊',
  },
  {
    name: 'Faculty Dashboard',
    path: '/faculty/dashboard',
    icon: '👨‍🏫',
    roles: ['faculty'],
  },
  {
    name: 'All Batches',
    path: '/batches',
    icon: '📚',
  },
  {
    name: 'Batch Progress',
    path: '/batches/progress',
    icon: '📈',
  },
  {
    name: 'Create Batch',
    path: '/batches/create',
    icon: '➕',
    roles: ['admin', 'superadmin'],
  },
  {
    name: 'Employee Details',
    path: '/employee/details',
    icon: '👤',
    roles: ['admin', 'superadmin', 'employee'],
  },
  {
    name: 'Student Enrollment',
    path: '/enrollment',
    icon: '📝',
    roles: ['admin', 'superadmin'],
  },
  {
    name: 'Student Leave Management',
    path: '/student-leaves',
    icon: '🏖️',
    roles: ['student', 'admin', 'superadmin'],
  },
  {
    name: 'Batch Extensions',
    path: '/batch-extensions',
    icon: '⏰',
    roles: ['admin', 'superadmin'],
  },
  {
    name: 'Software Completion',
    path: '/software-completions',
    icon: '✅',
    roles: ['faculty', 'admin', 'superadmin', 'student'],
  },
  {
    name: 'Users',
    path: '/users',
    icon: '👥',
    roles: ['admin', 'superadmin'],
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: '📊',
    roles: ['admin', 'superadmin'],
  },
  {
    name: 'Collections',
    path: '/collections',
    icon: '💳',
    roles: ['admin', 'superadmin'],
  },
  {
    name: 'Employee Attendance',
    path: '/employee-attendance',
    icon: '⏰',
    roles: ['employee', 'admin', 'superadmin'],
  },
];

export const Sidebar: React.FC = () => {
  const { user, logout, isAuthenticated, isImpersonating, originalUser, stopImpersonating } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gray-900 text-white w-64 z-40 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Company Logo */}
          <div className="p-6 border-b border-gray-700">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-white">P</span>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-500">PRIME</div>
                <div className="text-sm text-gray-400">ACADEMY</div>
              </div>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {filteredMenuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                      ${
                        isActive(item.path)
                          ? 'bg-orange-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-700">
            {user && (
              <div className="mb-4">
                {isImpersonating && originalUser && (
                  <div className="mb-3 p-2 bg-yellow-900/50 border border-yellow-600/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-semibold text-yellow-400">IMPERSONATING</span>
                    </div>
                    <p className="text-xs text-yellow-300">As: {user.name}</p>
                    <p className="text-xs text-yellow-400/80">Original: {originalUser.name} ({originalUser.email})</p>
                    <button
                      onClick={async () => {
                        setIsRestoring(true);
                        try {
                          await stopImpersonating();
                        } finally {
                          setIsRestoring(false);
                        }
                      }}
                      disabled={isRestoring}
                      className="mt-2 w-full text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:cursor-not-allowed text-white rounded transition-colors"
                    >
                      {isRestoring ? 'Restoring...' : 'Stop Impersonating'}
                    </button>
                  </div>
                )}
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="px-3">
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {user.role.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white font-medium"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

