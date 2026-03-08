import React from 'react';

const Layout = ({ children, backendStatus }) => {
  const isOnline = backendStatus?.includes('active');

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-gray-200 font-sans selection:bg-purple-500/30">
      <main className="flex-1 w-full max-w-[1200px] mx-auto">
        {children}
      </main>
      <footer className="mt-auto px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-500 text-sm w-full max-w-[1200px] mx-auto">
        <span>© 2026 QuotaAlert AI</span>
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
          API {isOnline ? 'en ligne' : 'hors ligne'}
        </span>
      </footer>
    </div>
  );
};

export default Layout;
