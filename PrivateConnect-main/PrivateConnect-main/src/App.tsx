import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ProfileCard from './components/features/ProfileCard';
import FilterBar from './components/features/FilterBar';
import LoginModal from './components/features/LoginModal';

// Initialize demo admin if not exists
const initializeDemoData = () => {
  const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
  
  if (users.length === 0) {
    const demoAdmin = {
      id: 'admin_1',
      username: 'Admin',
      email: 'admin@privateconnect.lk',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date().toISOString(),
      location: 'Colombo',
    };
    
    const demoUsers = [
      {
        id: 'user_demo1',
        username: 'Shalini Fernando',
        email: 'shalini@example.com',
        password: 'demo123',
        gender: 'Female',
        category: 'Girls Personal',
        location: 'Colombo',
        role: 'user',
        verified: true,
        verifiedGender: 'Female',
        canSetPrice: true,
        priceActivationStatus: 'approved',
        whatsappUnlockPrice: 2000, // Price to unlock WhatsApp contact
        whatsappNumber: '+94771234567',
        blocked: false,
        featured: true,
        featuredStatus: 'active',
        featuredExpiry: new Date(Date.now() + 86400000 * 2).toISOString(),
        featuredPlan: '3 Days',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        description: 'Premium verified profile. Free chat available. Unlock WhatsApp for video calls!'
      },
      {
        id: 'user_demo2',
        username: 'Kamal Silva',
        email: 'kamal@example.com',
        password: 'demo123',
        gender: 'Male',
        category: 'Boys Personal',
        location: 'Kandy',
        role: 'user',
        verified: true,
        verifiedGender: 'Male',
        canSetPrice: true,
        priceActivationStatus: 'approved',
        whatsappUnlockPrice: 1500,
        whatsappNumber: '+94777654321',
        blocked: false,
        featured: false,
        featuredStatus: 'none',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        description: 'Verified professional. Chat free, unlock WhatsApp for premium video services.'
      },
      {
        id: 'user_demo3',
        username: 'Amaya Perera',
        email: 'amaya@example.com',
        password: 'demo123',
        gender: 'Female',
        category: 'Live Cam',
        location: 'Galle',
        role: 'user',
        verified: true,
        verifiedGender: 'Female',
        canSetPrice: true,
        priceActivationStatus: 'approved',
        whatsappUnlockPrice: 2500,
        whatsappNumber: '+94712345678',
        blocked: false,
        featured: true,
        featuredStatus: 'active',
        featuredExpiry: new Date(Date.now() + 86400000 * 6).toISOString(),
        featuredPlan: '7 Days',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        description: 'Live cam specialist. Free messaging, pay to unlock WhatsApp video calls.'
      },
      {
        id: 'user_demo4',
        username: 'Sanath Bandara',
        email: 'sanath@example.com',
        password: 'demo123',
        gender: 'Male',
        category: 'Verified Profiles',
        location: 'Negombo',
        role: 'user',
        verified: true,
        verifiedGender: 'Male',
        canSetPrice: true,
        priceActivationStatus: 'approved',
        whatsappUnlockPrice: 1800,
        whatsappNumber: '+94769876543',
        blocked: false,
        featured: false,
        featuredStatus: 'none',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        description: 'Fully verified profile with secure communication. Unlock WhatsApp for calls.'
      },
      {
        id: 'user_demo5',
        username: 'Nisha Rajapaksa',
        email: 'nisha@example.com',
        password: 'demo123',
        gender: 'Female',
        category: 'Spa',
        location: 'Colombo',
        role: 'user',
        verified: true,
        verifiedGender: 'Female',
        canSetPrice: true,
        priceActivationStatus: 'approved',
        whatsappUnlockPrice: 3000,
        whatsappNumber: '+94751122334',
        blocked: false,
        featured: false,
        featuredStatus: 'none',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        description: 'Premium spa services. Free chat, unlock WhatsApp for video consultations.'
      },
      {
        id: 'user_demo6',
        username: 'Ravindra Kumar',
        email: 'ravindra@example.com',
        password: 'demo123',
        gender: 'Male',
        category: 'Boys Personal',
        location: 'Jaffna',
        role: 'user',
        verified: false,
        verifiedGender: null,
        canSetPrice: false,
        priceActivationStatus: 'none',
        whatsappUnlockPrice: null,
        whatsappNumber: null,
        blocked: false,
        featured: false,
        featuredStatus: 'none',
        createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
        profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        description: 'Pending verification - profile will be available soon.'
      },
    ];

    localStorage.setItem('privateconnect_users', JSON.stringify([demoAdmin, ...demoUsers]));
  }
};

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(true); // Auto-show login on load
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [locationFilter, setLocationFilter] = useState('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    initializeDemoData();
    ensureAdminExists(); // Ensure admin account exists
    const storedUser = localStorage.getItem('privateconnect_currentUser');
    if (storedUser && storedUser !== 'null') {
      setCurrentUser(JSON.parse(storedUser));
      setShowLoginModal(false); // Hide login if user already logged in
    }
    loadUsers();
  }, []);

  const ensureAdminExists = () => {
    const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
    const adminExists = users.find((u: any) => u.email === 'jayakodyarachchigemahisha@gmail.com' && u.role === 'admin');
    
    if (!adminExists) {
      const adminUser = {
        id: 'admin_main',
        username: 'Admin',
        email: 'jayakodyarachchigemahisha@gmail.com',
        password: 'admin123', // Default password (user should change it)
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      users.push(adminUser);
      localStorage.setItem('privateconnect_users', JSON.stringify(users));
      console.log('✅ Admin account created: jayakodyarachchigemahisha@gmail.com');
    }
  };

  const loadUsers = () => {
    const allUsers = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
    setUsers(allUsers.filter((u: any) => u.role !== 'admin'));
  };

  const handleLogin = () => {
    const storedUser = localStorage.getItem('privateconnect_currentUser');
    if (storedUser && storedUser !== 'null') {
      setCurrentUser(JSON.parse(storedUser));
      setShowLoginModal(false);
      loadUsers();
    }
  };

  const handleLogout = () => {
    localStorage.setItem('privateconnect_currentUser', JSON.stringify(null));
    setCurrentUser(null);
  };

  // Check and expire featured status
  useEffect(() => {
    const checkFeaturedExpiry = () => {
      const allUsers = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
      let updated = false;
      
      allUsers.forEach((user: any) => {
        if (user.featured && user.featuredExpiry && new Date(user.featuredExpiry) < new Date()) {
          user.featured = false;
          user.featuredStatus = 'expired';
          updated = true;
        }
      });
      
      if (updated) {
        localStorage.setItem('privateconnect_users', JSON.stringify(allUsers));
        loadUsers();
      }
    };
    
    checkFeaturedExpiry();
    const interval = setInterval(checkFeaturedExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Filter and search logic
  const getFilteredUsers = () => {
    let filtered = users.filter((u: any) => !u.blocked);

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'Verified Profiles') {
        filtered = filtered.filter((u: any) => u.verified);
      } else {
        filtered = filtered.filter((u: any) => u.category === selectedCategory);
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((u: any) => 
        u.username.toLowerCase().includes(query) ||
        u.category.toLowerCase().includes(query) ||
        (u.description && u.description.toLowerCase().includes(query))
      );
    }

    // Gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter((u: any) => u.gender === genderFilter);
    }

    // Verified only filter
    if (verifiedOnly) {
      filtered = filtered.filter((u: any) => u.verified);
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter((u: any) => u.location === locationFilter);
    }

    // Featured only filter
    if (featuredOnly) {
      filtered = filtered.filter((u: any) => u.featured && u.featuredStatus === 'active');
    }

    // Price range filter (WhatsApp unlock price)
    if (minPrice || maxPrice) {
      filtered = filtered.filter((u: any) => {
        if (!u.canSetPrice || u.priceActivationStatus !== 'approved') return false;
        if (!u.whatsappUnlockPrice) return false;

        if (minPrice && u.whatsappUnlockPrice < parseInt(minPrice)) return false;
        if (maxPrice && u.whatsappUnlockPrice > parseInt(maxPrice)) return false;
        
        return true;
      });
    }

    // Sorting
    // Featured profiles always appear first
    filtered.sort((a: any, b: any) => {
      const aFeatured = a.featured && a.featuredStatus === 'active' ? 1 : 0;
      const bFeatured = b.featured && b.featuredStatus === 'active' ? 1 : 0;
      
      if (aFeatured !== bFeatured) {
        return bFeatured - aFeatured; // Featured first
      }
      
      // Then apply selected sorting
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

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentUser={currentUser}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

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
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">
                {selectedCategory === 'all' ? 'All Profiles' : selectedCategory}
              </h1>
              <p className="text-muted-foreground">
                💬 Free Chat & Voice | 🎥 Unlock WhatsApp for Video Calls
              </p>
            </div>

            {/* Search & Filters */}
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

            {/* Results Count */}
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'profile' : 'profiles'}
            </div>

            {/* Profile Listings */}
            <div className="space-y-4">
              {filteredUsers.length > 0 ? (
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

            {/* 18+ Notice */}
            <div className="mt-8 p-4 bg-muted rounded-lg border border-border">
              <div className="text-sm text-center text-muted-foreground">
                <strong className="text-foreground">18+ Platform Notice:</strong> Free Chat & Voice calls on this site. 
                WhatsApp/Video calls require payment. Phone number sharing in chat is prohibited.
              </div>
            </div>
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
