const API_BASE = '';

async function request(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    register: (data: any) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (email: string, password: string) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
    me: () => request('/api/auth/me'),
  },

  profiles: {
    list: (params?: { category?: string; location?: string; verified?: boolean; featured?: boolean; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.location) query.set('location', params.location);
      if (params?.verified) query.set('verified', 'true');
      if (params?.featured) query.set('featured', 'true');
      if (params?.search) query.set('search', params.search);
      return request(`/api/profiles?${query.toString()}`);
    },
    get: (id: string) => request(`/api/profiles/${id}`),
  },

  user: {
    updateProfile: (data: any) => request('/api/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
    getWallet: () => request('/api/user/wallet'),
    requestPriceActivation: (data: any) => request('/api/user/price-activation', { method: 'POST', body: JSON.stringify(data) }),
    requestFeatured: (data: any) => request('/api/user/featured-request', { method: 'POST', body: JSON.stringify(data) }),
  },

  stripe: {
    checkout: (data: { priceId?: string; profileId?: string; type: string }) => 
      request('/api/stripe/checkout', { method: 'POST', body: JSON.stringify(data) }),
    getPublishableKey: () => request('/api/stripe/publishable-key'),
  },

  admin: {
    getUsers: (filter?: string, search?: string) => {
      const query = new URLSearchParams();
      if (filter) query.set('filter', filter);
      if (search) query.set('search', search);
      return request(`/api/admin/users?${query.toString()}`);
    },
    verifyUser: (id: string, verified: boolean, verifiedGender?: string) => 
      request(`/api/admin/users/${id}/verify`, { method: 'PUT', body: JSON.stringify({ verified, verifiedGender }) }),
    blockUser: (id: string, blocked: boolean) => 
      request(`/api/admin/users/${id}/block`, { method: 'PUT', body: JSON.stringify({ blocked }) }),
    updateSubscription: (id: string, subscriptionStatus: string, subscriptionExpiryDate?: string) => 
      request(`/api/admin/users/${id}/subscription`, { method: 'PUT', body: JSON.stringify({ subscriptionStatus, subscriptionExpiryDate }) }),
    getPriceActivations: () => request('/api/admin/price-activations'),
    approvePriceActivation: (id: string, userId: string) => 
      request(`/api/admin/price-activations/${id}/approve`, { method: 'PUT', body: JSON.stringify({ userId }) }),
    getFeaturedRequests: () => request('/api/admin/featured-requests'),
    approveFeaturedRequest: (id: string, userId: string, plan: string) => 
      request(`/api/admin/featured-requests/${id}/approve`, { method: 'PUT', body: JSON.stringify({ userId, plan }) }),
  },
};
