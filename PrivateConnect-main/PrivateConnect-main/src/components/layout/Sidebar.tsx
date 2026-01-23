import { X, User, Users, Video, Sparkles, CheckCircle, Grid } from 'lucide-react';

interface SidebarProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onLoginClick: () => void;
}

const categories = [
  { id: 'all', name: 'All Categories', icon: Grid },
  { id: 'Girls Personal', name: 'Girls Personal', icon: User },
  { id: 'Boys Personal', name: 'Boys Personal', icon: Users },
  { id: 'Live Cam', name: 'Live Cam', icon: Video },
  { id: 'Spa', name: 'Spa', icon: Sparkles },
  { id: 'Verified Profiles', name: 'Verified Profiles', icon: CheckCircle },
];

export default function Sidebar({ selectedCategory, onCategorySelect, isOpen, onClose, currentUser, onLoginClick }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border transition-transform duration-300 z-50 overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-4">
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 p-2 hover:bg-muted rounded-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Login/Account Section */}
          <div className="mb-6 pb-4 border-b border-border">
            {!currentUser ? (
              <button 
                onClick={onLoginClick}
                className="w-full btn-primary"
              >
                Login / Register
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  Welcome, {currentUser.username}!
                </div>
                <a href="/dashboard.html" className="block w-full btn-secondary text-center">
                  My Account
                </a>
              </div>
            )}
          </div>

          {/* Categories */}
          <nav className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Categories
            </div>
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => onCategorySelect(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-muted'}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="text-xs font-semibold text-foreground mb-1">18+ Platform</div>
            <div className="text-xs text-muted-foreground">
              All profiles are admin-verified. Private features require payment approval.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
