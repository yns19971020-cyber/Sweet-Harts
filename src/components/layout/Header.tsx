import { Menu, Heart } from 'lucide-react';

interface HeaderProps {
  currentUser: any;
  onLoginClick: () => void;
  onLogout: () => void;
  onMenuClick: () => void;
}

export default function Header({ currentUser, onLoginClick, onLogout, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button 
              onClick={onMenuClick}
              className="md:hidden p-2 hover:bg-white/20 rounded-md text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <a href="/" className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-white fill-white" />
              <div>
                <span className="text-2xl font-bold text-white">Sweet Hearts</span>
                <p className="text-xs text-white/80 hidden sm:block">Real connections, real feelings</p>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-3">
            {!currentUser ? (
              <>
                <button onClick={onLoginClick} className="bg-white text-pink-600 hover:bg-pink-50 px-4 py-2 rounded-full font-medium transition-colors text-sm md:text-base">
                  Login
                </button>
                <a href="/register.html" className="bg-pink-700 text-white hover:bg-pink-800 px-4 py-2 rounded-full font-medium transition-colors text-sm md:text-base">
                  Register
                </a>
              </>
            ) : (
              <>
                {currentUser.role === 'admin' && (
                  <a href="/admin.html" className="bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 rounded-full font-medium transition-colors text-sm md:text-base">
                    Admin Panel
                  </a>
                )}
                <a href="/dashboard.html" className="bg-white/20 text-white hover:bg-white/30 px-4 py-2 rounded-full font-medium transition-colors text-sm md:text-base">
                  Dashboard
                </a>
                <button onClick={onLogout} className="border border-white/50 text-white hover:bg-white/20 px-4 py-2 rounded-full font-medium transition-colors text-sm md:text-base">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
