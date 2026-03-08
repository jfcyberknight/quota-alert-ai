import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogin, onLogout }) => {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 flex flex-wrap items-center justify-between px-4 py-3 md:px-8 bg-white/5 border-b border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-decoration-none">
          <span className="text-xl md:text-2xl">⚡</span>
          <span className="text-lg md:text-xl font-bold tracking-tight bg-gradient-to-br from-purple-400 to-blue-400 bg-clip-text text-transparent">
            QuotaAlert AI
          </span>
        </Link>
      </div>

      <div className="flex items-center md:hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-gray-400 hover:text-white focus:outline-none p-2"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          )}
        </button>
      </div>

      <div className={`${isOpen ? 'flex' : 'hidden'} w-full flex-col mt-4 gap-4 md:mt-0 md:flex md:w-auto md:flex-row md:items-center md:gap-6`}>
        {user && (
          <div className="flex flex-col md:flex-row gap-2 md:gap-1">
            {[{ to: '/', label: 'Dashboard' }, { to: '/admin', label: 'Admin' }].map(({ to, label }) => (
              <Link key={to} to={to} className={`px-4 py-2 md:px-3 md:py-1.5 rounded-lg text-sm transition-colors duration-200 ${
                pathname === to 
                  ? 'font-semibold text-white bg-white/10' 
                  : 'font-normal text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}>
                {label}
              </Link>
            ))}
          </div>
        )}

        <div>
          {user ? (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-4 border-t border-white/10 md:border-0 pt-4 md:pt-0">
              <div className="flex items-center gap-2">
                {user.photoURL && (
                  <img src={user.photoURL} alt="" className="w-8 h-8 md:w-7 md:h-7 rounded-full" />
                )}
                <span className="text-sm text-gray-400">
                  {user.displayName || user.email}
                </span>
              </div>
              <button onClick={onLogout} className="w-full md:w-auto px-4 py-2 md:py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
                Déconnexion
              </button>
            </div>
          ) : (
            <button onClick={onLogin} className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/20 transition-all">
              Se connecter avec Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;