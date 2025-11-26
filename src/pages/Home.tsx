import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-orange-500">PRIME</span> ACADEMY
          </h1>
          <p className="text-xl text-gray-300 mb-2">Digital Art With Excellence</p>
          <p className="text-gray-400 mb-8">SINCE 2013</p>

          <div className="mt-12 flex gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-block px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-block px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition"
                >
                  Login
                </Link>
                <Link
                  to="/enrollment"
                  className="inline-block px-8 py-3 bg-transparent border-2 border-orange-600 text-orange-600 font-semibold rounded-lg hover:bg-orange-600 hover:text-white transition"
                >
                  Enroll Now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

