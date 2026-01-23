import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  genderFilter: string;
  onGenderChange: (gender: string) => void;
  verifiedOnly: boolean;
  onVerifiedChange: (verified: boolean) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (price: string) => void;
  onMaxPriceChange: (price: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  locationFilter: string;
  onLocationChange: (location: string) => void;
  featuredOnly: boolean;
  onFeaturedChange: (featured: boolean) => void;
}

const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

export default function FilterBar({
  searchQuery,
  onSearchChange,
  genderFilter,
  onGenderChange,
  verifiedOnly,
  onVerifiedChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  sortBy,
  onSortChange,
  locationFilter,
  onLocationChange,
  featuredOnly,
  onFeaturedChange,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by username, category, description..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-md font-medium transition-colors ${
            showFilters 
              ? 'bg-primary text-primary-foreground border-primary' 
              : 'bg-background border-input hover:bg-muted'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border">
          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => onLocationChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Locations</option>
              {SRI_LANKAN_DISTRICTS.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <select
              value={genderFilter}
              onChange={(e) => onGenderChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-sm font-medium mb-2">Min Price (Rs.)</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-medium mb-2">Max Price (Rs.)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              placeholder="No limit"
              min="0"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Verified Only */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="verifiedOnly"
              checked={verifiedOnly}
              onChange={(e) => onVerifiedChange(e.target.checked)}
              className="w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-ring"
            />
            <label htmlFor="verifiedOnly" className="ml-2 text-sm font-medium">
              Verified Profiles Only
            </label>
          </div>

          {/* Featured Only */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featuredOnly"
              checked={featuredOnly}
              onChange={(e) => onFeaturedChange(e.target.checked)}
              className="w-4 h-4 text-warning border-input rounded focus:ring-2 focus:ring-ring"
            />
            <label htmlFor="featuredOnly" className="ml-2 text-sm font-medium">
              ⭐ Featured Profiles Only
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
