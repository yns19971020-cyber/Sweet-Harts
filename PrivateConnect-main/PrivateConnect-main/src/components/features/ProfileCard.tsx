import { CheckCircle, Eye, MessageCircle, Phone, Video, MapPin, Star } from 'lucide-react';

interface ProfileCardProps {
  user: any;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const views = Math.floor(Math.random() * 500) + 50; // Simulated views

  const isFeatured = user.featured && user.featuredStatus === 'active';

  return (
    <div className={`card-profile cursor-pointer hover:border-primary/50 transition-all ${
      isFeatured ? 'border-warning border-2 shadow-lg bg-warning/5' : ''
    }`} onClick={() => window.location.href = `/profile.html?id=${user.id}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Profile Image */}
        <div className="relative">
          <img 
            src={user.profileImage || 'https://via.placeholder.com/120'} 
            alt={user.username}
            className="w-full sm:w-28 h-28 rounded-lg object-cover"
          />
          {user.verified && (
            <div className="absolute -top-2 -right-2 bg-verified text-white rounded-full p-1">
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
          {isFeatured && (
            <div className="absolute -bottom-2 -left-2 bg-warning text-white rounded-full p-1.5 shadow-lg">
              <Star className="w-4 h-4 fill-current" />
            </div>
          )}
        </div>
        
        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-lg font-bold truncate">{user.username}</h3>
                {user.verified && (
                  <span className="verified-badge whitespace-nowrap">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                <span className="category-badge">{user.category}</span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                  {user.gender}
                </span>
                {isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-warning text-white">
                    <Star className="w-3 h-3 fill-current" />
                    FEATURED
                  </span>
                )}
              </div>

              {/* Location */}
              {user.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3" />
                  <span>{user.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description (if any) */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {user.description || `Free chat & voice available. Unlock WhatsApp for video calls!`}
          </p>

          {/* Free & Paid Services */}
          {user.canSetPrice && user.priceActivationStatus === 'approved' ? (
            <div className="mb-3">
              {/* Free Services */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-sm bg-green-50 text-green-700 px-2 py-1.5 rounded-md border border-green-200">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-semibold">Chat – FREE</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm bg-green-50 text-green-700 px-2 py-1.5 rounded-md border border-green-200">
                  <Phone className="w-4 h-4" />
                  <span className="font-semibold">Voice – FREE</span>
                </div>
              </div>
              
              {/* WhatsApp Unlock Price */}
              {user.whatsappUnlockPrice && (
                <div className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-2 rounded-md font-bold">
                  <Video className="w-4 h-4" />
                  <span>🎥 Unlock WhatsApp – Rs.{user.whatsappUnlockPrice}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md mb-3">
              🔒 Service activation pending
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{views} views</span>
            </div>
            <span>Posted {getTimeSince(user.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
