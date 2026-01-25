const API_BASE = '';

function sanitizePrice(value) {
  const num = parseFloat(value);
  return isNaN(num) ? '0' : num.toString();
}

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
    pricingSection.textContent = '';

    const freeServicesSection = document.createElement('div');
    freeServicesSection.className = 'col-span-full bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200';

    const freeTitle = document.createElement('h3');
    freeTitle.className = 'text-lg font-bold mb-4 text-green-800';
    freeTitle.textContent = 'FREE Services (Use Now)';
    freeServicesSection.appendChild(freeTitle);

    const freeGrid = document.createElement('div');
    freeGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3 mb-4';

    const chatCard = document.createElement('div');
    chatCard.className = 'bg-white p-4 rounded-lg border border-green-300';
    const chatLabel = document.createElement('div');
    chatLabel.className = 'text-sm text-gray-600 mb-1';
    chatLabel.textContent = 'Private Chat';
    const chatPrice = document.createElement('div');
    chatPrice.className = 'text-2xl font-bold text-green-600';
    chatPrice.textContent = 'FREE';
    chatCard.appendChild(chatLabel);
    chatCard.appendChild(chatPrice);

    const voiceCard = document.createElement('div');
    voiceCard.className = 'bg-white p-4 rounded-lg border border-green-300';
    const voiceLabel = document.createElement('div');
    voiceLabel.className = 'text-sm text-gray-600 mb-1';
    voiceLabel.textContent = 'Voice Call';
    const voicePrice = document.createElement('div');
    voicePrice.className = 'text-2xl font-bold text-green-600';
    voicePrice.textContent = 'FREE';
    voiceCard.appendChild(voiceLabel);
    voiceCard.appendChild(voicePrice);

    freeGrid.appendChild(chatCard);
    freeGrid.appendChild(voiceCard);
    freeServicesSection.appendChild(freeGrid);
    pricingSection.appendChild(freeServicesSection);

    const whatsappSection = document.createElement('div');
    whatsappSection.className = 'col-span-full bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-300 mt-4';

    const whatsappTitle = document.createElement('h3');
    whatsappTitle.className = 'text-lg font-bold mb-3 text-blue-800';
    whatsappTitle.textContent = 'WhatsApp Video Call - Unlock';
    whatsappSection.appendChild(whatsappTitle);

    const whatsappCard = document.createElement('div');
    whatsappCard.className = 'bg-white p-5 rounded-lg border border-blue-300';

    const priceLabel = document.createElement('div');
    priceLabel.className = 'text-sm text-gray-600 mb-2';
    priceLabel.textContent = 'WhatsApp Contact Unlock Price';

    const priceValue = document.createElement('div');
    priceValue.className = 'text-3xl font-bold text-blue-600 mb-2';
    priceValue.textContent = 'Rs. ' + sanitizePrice(profileUser.whatsappUnlockPrice);

    const benefitsDesc = document.createElement('div');
    benefitsDesc.className = 'text-sm text-gray-600';

    const benefitsIntro = document.createElement('p');
    benefitsIntro.className = 'mb-2';
    benefitsIntro.textContent = 'Unlocking WhatsApp gives you:';

    const benefitsList = document.createElement('ul');
    benefitsList.className = 'list-disc list-inside text-xs text-gray-700 space-y-1';
    ['WhatsApp Video Calls', 'WhatsApp Photos & Files sharing', 'Direct contact 24/7'].forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      benefitsList.appendChild(li);
    });

    benefitsDesc.appendChild(benefitsIntro);
    benefitsDesc.appendChild(benefitsList);
    whatsappCard.appendChild(priceLabel);
    whatsappCard.appendChild(priceValue);
    whatsappCard.appendChild(benefitsDesc);
    whatsappSection.appendChild(whatsappCard);
    pricingSection.appendChild(whatsappSection);
  } else {
    pricingSection.textContent = '';
    notActivatedMessage.classList.remove('hidden');
  }

  const lockMessage = document.getElementById('lockMessage');

  if (!profileUser.verified || !profileUser.canSetPrice) {
    lockMessage.classList.remove('hidden');
    lockMessage.textContent = '';
    const lockStrong = document.createElement('strong');
    lockStrong.textContent = 'Profile Locked:';
    lockMessage.appendChild(lockStrong);
    lockMessage.appendChild(document.createTextNode(' This profile has not completed verification and activation yet.'));
  } else {
    lockMessage.classList.add('hidden');
    
    const buttonContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.gap-4');
    buttonContainer.textContent = '';

    const btnFreeChat = document.createElement('button');
    btnFreeChat.id = 'btnFreeChat';
    btnFreeChat.className = 'px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700';
    btnFreeChat.textContent = 'Free Chat';
    buttonContainer.appendChild(btnFreeChat);

    const btnFreeVoice = document.createElement('button');
    btnFreeVoice.id = 'btnFreeVoice';
    btnFreeVoice.className = 'px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700';
    btnFreeVoice.textContent = 'Free Voice Call';
    buttonContainer.appendChild(btnFreeVoice);

    const btnUnlockWhatsApp = document.createElement('button');
    btnUnlockWhatsApp.id = 'btnUnlockWhatsApp';
    btnUnlockWhatsApp.className = 'px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700';
    btnUnlockWhatsApp.textContent = 'Unlock WhatsApp (Rs.' + sanitizePrice(profileUser.whatsappUnlockPrice) + ')';
    buttonContainer.appendChild(btnUnlockWhatsApp);

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

      alert(`WhatsApp Unlock කිරීමට:\n\n` +
        `1. බැංකු ගිණුමට Rs.${profileUser.whatsappUnlockPrice} මුදල් යොමු කරන්න:\n` +
        `   Sampath Bank - 105057458082\n` +
        `   J A Y S Kavinda (Kadawatha)\n\n` +
        `2. ඔබගේ Dashboard එකේ "Admin වෙත පණිවිඩය" බොත්තම ඔබා රිසිට් එක එවන්න.\n\n` +
        `3. Admin විසින් සත්‍යාපනය කළ පසු WhatsApp අංකය unlock වේ.`);
      
      window.location.href = '/dashboard.html';
    });
  }
}
