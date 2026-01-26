import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ProfileCard from './components/features/ProfileCard';
import FilterBar from './components/features/FilterBar';
import LoginModal from './components/features/LoginModal';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import AboutUs from './pages/AboutUs';
import { api } from './lib/api';

type PageType = 'home' | 'privacy' | 'terms' | 'about';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [locationFilter, setLocationFilter] = useState('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    checkAuth();
    loadProfiles();
  }, []);

  const checkAuth = async () => {
    try {
      const { user } = await api.auth.me();
      setCurrentUser(user);
      setShowLoginModal(false);
    } catch (error) {
      setCurrentUser(null);
    }
  };

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const { profiles } = await api.profiles.list();
      setUsers(profiles || []);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    await checkAuth();
    loadProfiles();
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getFilteredUsers = () => {
    let filtered = users.filter((u: any) => !u.blocked);

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'Verified Profiles') {
        filtered = filtered.filter((u: any) => u.verified);
      } else {
        filtered = filtered.filter((u: any) => u.category === selectedCategory);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((u: any) => 
        u.username?.toLowerCase().includes(query) ||
        u.category?.toLowerCase().includes(query) ||
        (u.description && u.description.toLowerCase().includes(query))
      );
    }

    if (genderFilter !== 'all') {
      filtered = filtered.filter((u: any) => u.gender === genderFilter);
    }

    if (verifiedOnly) {
      filtered = filtered.filter((u: any) => u.verified);
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter((u: any) => u.location === locationFilter);
    }

    if (featuredOnly) {
      filtered = filtered.filter((u: any) => u.featured && u.featuredStatus === 'active');
    }

    if (minPrice || maxPrice) {
      filtered = filtered.filter((u: any) => {
        if (!u.canSetPrice || u.priceActivationStatus !== 'approved') return false;
        if (!u.whatsappUnlockPrice) return false;

        if (minPrice && u.whatsappUnlockPrice < parseInt(minPrice)) return false;
        if (maxPrice && u.whatsappUnlockPrice > parseInt(maxPrice)) return false;
        
        return true;
      });
    }

    filtered.sort((a: any, b: any) => {
      const aFeatured = a.featured && a.featuredStatus === 'active' ? 1 : 0;
      const bFeatured = b.featured && b.featuredStatus === 'active' ? 1 : 0;
      
      if (aFeatured !== bFeatured) {
        return bFeatured - aFeatured;
      }
      
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
    
    if (sortBy === 'price-low' || sortBy === 'price-high') {
      filtered.sort((a: any, b: any) => {
        const aFeatured = a.featured && a.featuredStatus === 'active' ? 1 : 0;
        const bFeatured = b.featured && b.featuredStatus === 'active' ? 1 : 0;
        
        if (aFeatured !== bFeatured) {
          return bFeatured - aFeatured;
        }
        
        const priceA = a.whatsappUnlockPrice || 0;
        const priceB = b.whatsappUnlockPrice || 0;

        if (priceA === 0 && priceB === 0) return 0;
        if (priceA === 0) return 1;
        if (priceB === 0) return -1;

        return sortBy === 'price-low' ? priceA - priceB : priceB - priceA;
      });
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  if (currentPage === 'privacy') {
    return <PrivacyPolicy onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'terms') {
    return <TermsConditions onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'about') {
    return <AboutUs onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentUser={currentUser}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <div 
        className="relative h-80 md:h-96 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 drop-shadow-lg">
            ඔබේ සිතැඟි පරිදි Girl කෙනෙක් හෝ Boy කෙනෙක්
          </h1>
          <p className="text-xl md:text-2xl mb-2 drop-shadow-md">
            හොයාගන්න මෙන්න එකම තැන
          </p>
          <p className="text-lg italic text-pink-200 drop-shadow-md">Love begins online</p>
        </div>
      </div>

      <div className="flex">
        <Sidebar
          selectedCategory={selectedCategory}
          onCategorySelect={(cat) => {
            setSelectedCategory(cat);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentUser={currentUser}
          onLoginClick={() => setShowLoginModal(true)}
        />

        <main className="flex-1 md:ml-64 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">
                {selectedCategory === 'all' ? 'All Profiles' : selectedCategory}
              </h1>
              <p className="text-muted-foreground">
                Free Chat & Voice | Unlock WhatsApp for Video Calls
              </p>
            </div>

            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              genderFilter={genderFilter}
              onGenderChange={setGenderFilter}
              verifiedOnly={verifiedOnly}
              onVerifiedChange={setVerifiedOnly}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              sortBy={sortBy}
              onSortChange={setSortBy}
              locationFilter={locationFilter}
              onLocationChange={setLocationFilter}
              featuredOnly={featuredOnly}
              onFeaturedChange={setFeaturedOnly}
            />

            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'profile' : 'profiles'}
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-4 animate-spin">⏳</div>
                  <p className="text-muted-foreground">Loading profiles...</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => (
                  <ProfileCard key={user.id} user={user} />
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">No profiles found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search criteria
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg border border-border">
              <div className="text-sm text-center text-muted-foreground">
                <strong className="text-foreground">18+ Platform Notice:</strong> Free Chat & Voice calls on this site. 
                WhatsApp/Video calls require payment. Phone number sharing in chat is prohibited.
              </div>
            </div>

            <footer className="mt-12 pt-8 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">About Sweet Hearts</h3>
                  <p className="text-sm text-muted-foreground">
                    Sri Lanka's premier platform for real connections. All profiles are admin-verified for your safety and trust. Real connections, real feelings.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Quick Links</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <button 
                        onClick={() => setCurrentPage('about')} 
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        About Us
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => setCurrentPage('privacy')} 
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        Privacy Policy
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => setCurrentPage('terms')} 
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        Terms & Conditions
                      </button>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Contact</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Email: support@sweethearts.lk</li>
                    <li>Website: www.sweethearts.lk</li>
                  </ul>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground py-4 border-t border-border">
                <p>&copy; 2026 Sweet Hearts. All rights reserved.</p>
                <p className="mt-1">Real connections, real feelings | 18+ Adults Only</p>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}

export default App;
