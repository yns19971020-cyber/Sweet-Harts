const API_BASE = '';

async function apiRequest(endpoint, options = {}) {
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

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id');

if (!userId) {
  alert('Invalid profile');
  window.location.href = '/';
}

let currentUser = null;
let profileUser = null;

init();

async function init() {
  try {
    const authResponse = await apiRequest('/api/auth/me').catch(() => null);
    currentUser = authResponse?.user || null;
  } catch (e) {
    currentUser = null;
  }

  try {
    const { profile } = await apiRequest(`/api/profiles/${userId}`);
    profileUser = profile;
    displayProfile();
  } catch (error) {
    alert('Profile not found');
    window.location.href = '/';
  }
}

function displayProfile() {
  document.getElementById('profileImage').src = profileUser.profileImage || 'https://via.placeholder.com/200';
  document.getElementById('profileUsername').textContent = profileUser.username;
  document.getElementById('profileGender').textContent = profileUser.gender;
  document.getElementById('profileCategory').textContent = profileUser.category;
  document.getElementById('profileLocation').textContent = profileUser.location || 'Not specified';

  if (profileUser.verified) {
    document.getElementById('verifiedBadge').classList.remove('hidden');
    document.getElementById('profileStatus').textContent = 'Verified';
    document.getElementById('profileStatus').className = 'text-lg font-semibold text-green-600';
  } else {
    document.getElementById('profileStatus').textContent = 'Pending';
    document.getElementById('profileStatus').className = 'text-lg font-semibold text-orange-600';
  }

  if (profileUser.featured && profileUser.featuredStatus === 'active') {
    document.getElementById('featuredBadge').classList.remove('hidden');
  }

  const pricingSection = document.getElementById('pricingSection');
  const notActivatedMessage = document.getElementById('notActivatedMessage');

  if (profileUser.canSetPrice && profileUser.priceActivationStatus === 'approved' && profileUser.whatsappUnlockPrice) {
    notActivatedMessage.classList.add('hidden');
    pricingSection.innerHTML = `
      <div class="col-span-full bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
        <h3 class="text-lg font-bold mb-4 text-green-800">FREE Services (Use Now)</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div class="bg-white p-4 rounded-lg border border-green-300">
            <div class="text-sm text-gray-600 mb-1">Private Chat</div>
            <div class="text-2xl font-bold text-green-600">FREE</div>
          </div>
          <div class="bg-white p-4 rounded-lg border border-green-300">
            <div class="text-sm text-gray-600 mb-1">Voice Call</div>
            <div class="text-2xl font-bold text-green-600">FREE</div>
          </div>
        </div>
      </div>

      <div class="col-span-full bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-300 mt-4">
        <h3 class="text-lg font-bold mb-3 text-blue-800">WhatsApp Video Call - Unlock</h3>
        <div class="bg-white p-5 rounded-lg border border-blue-300">
          <div class="text-sm text-gray-600 mb-2">WhatsApp Contact Unlock Price</div>
          <div class="text-3xl font-bold text-blue-600 mb-2">Rs. ${profileUser.whatsappUnlockPrice}</div>
          <div class="text-sm text-gray-600">
            <p class="mb-2">Unlocking WhatsApp gives you:</p>
            <ul class="list-disc list-inside text-xs text-gray-700 space-y-1">
              <li>WhatsApp Video Calls</li>
              <li>WhatsApp Photos & Files sharing</li>
              <li>Direct contact 24/7</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  } else {
    pricingSection.innerHTML = '';
    notActivatedMessage.classList.remove('hidden');
  }

  const lockMessage = document.getElementById('lockMessage');

  if (!profileUser.verified || !profileUser.canSetPrice) {
    lockMessage.classList.remove('hidden');
    lockMessage.innerHTML = '<strong>Profile Locked:</strong> This profile has not completed verification and activation yet.';
  } else {
    lockMessage.classList.add('hidden');
    
    const buttonContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.gap-4');
    buttonContainer.innerHTML = `
      <button id="btnFreeChat" class="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
        Free Chat
      </button>
      <button id="btnFreeVoice" class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
        Free Voice Call
      </button>
      <button id="btnUnlockWhatsApp" class="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
        Unlock WhatsApp (Rs.${profileUser.whatsappUnlockPrice})
      </button>
    `;

    document.getElementById('btnFreeChat').addEventListener('click', function() {
      if (!currentUser) {
        alert('Please login first.');
        window.location.href = '/';
        return;
      }
      alert(`Free Chat with ${profileUser.username}\n\nChat feature coming soon!`);
    });

    document.getElementById('btnFreeVoice').addEventListener('click', function() {
      if (!currentUser) {
        alert('Please login first.');
        window.location.href = '/';
        return;
      }
      alert(`Free Voice Call with ${profileUser.username}\n\nVoice call feature coming soon!`);
    });

    document.getElementById('btnUnlockWhatsApp').addEventListener('click', async function() {
      if (!currentUser) {
        alert('Please login first.');
        window.location.href = '/';
        return;
      }

      if (currentUser.id === profileUser.id) {
        alert('Cannot unlock your own profile.');
        return;
      }

      try {
        const { url } = await apiRequest('/api/stripe/checkout', {
          method: 'POST',
          body: JSON.stringify({
            type: 'whatsapp_unlock',
            profileId: profileUser.id,
          }),
        });
        
        if (url) {
          window.location.href = url;
        }
      } catch (error) {
        alert('Payment failed: ' + error.message);
      }
    });
  }
}
