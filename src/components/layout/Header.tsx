import { Menu } from 'lucide-react';

interface HeaderProps {
  currentUser: any;
  onLoginClick: () => void;
  onLogout: () => void;
  onMenuClick: () => void;
}

export default function Header({ currentUser, onLoginClick, onLogout, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button 
              onClick={onMenuClick}
              className="md:hidden p-2 hover:bg-muted rounded-md"
            >
              <Menu className="w-6 h-6" />
            </button>
            <a href="/" className="text-2xl font-bold text-primary">
              PrivateConnect
            </a>
          </div>

          <div className="flex items-center gap-3">
            {!currentUser ? (
              <>
                <button onClick={onLoginClick} className="btn-primary text-sm md:text-base">
                  Login
                </button>
                <a href="/register.html" className="btn-accent text-sm md:text-base">
                  Register
                </a>
              </>
            ) : (
              <>
                {currentUser.role === 'admin' && (
                  <a href="/admin.html" className="btn-accent text-sm md:text-base">
                    Admin Panel
                  </a>
                )}
                <a href="/dashboard.html" className="btn-secondary text-sm md:text-base">
                  Dashboard
                </a>
                <button onClick={onLogout} className="btn-outline text-sm md:text-base">
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
