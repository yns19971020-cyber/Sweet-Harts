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

let currentUser = null;

init();

async function init() {
  try {
    const { user } = await apiRequest('/api/auth/me');
    if (!user || user.role === 'admin') {
      alert('Please login as a user');
      window.location.href = '/';
      return;
    }
    currentUser = user;
    displayUserInfo();
    loadWallet();
  } catch (error) {
    alert('Please login first');
    window.location.href = '/';
  }
}

async function displayUserInfo() {
  document.getElementById('verificationStatus').textContent = currentUser.verified ? 'Verified' : 'Pending';
  document.getElementById('verificationStatus').className = currentUser.verified 
    ? 'text-lg font-semibold text-green-600' 
    : 'text-lg font-semibold text-orange-600';

  document.getElementById('userCategory').textContent = currentUser.category;
  document.getElementById('userLocation').textContent = currentUser.location || 'Not set';

  const subStatus = currentUser.subscriptionStatus || 'pending';
  if (subStatus === 'active') {
    document.getElementById('subscriptionStatus').textContent = `Active (${currentUser.subscriptionPlan || 'Standard'})`;
    document.getElementById('subscriptionStatus').className = 'text-lg font-semibold text-green-600';
  } else if (subStatus === 'pending') {
    document.getElementById('subscriptionStatus').textContent = 'Pending Approval';
    document.getElementById('subscriptionStatus').className = 'text-lg font-semibold text-orange-600';
  } else {
    document.getElementById('subscriptionStatus').textContent = 'Expired';
    document.getElementById('subscriptionStatus').className = 'text-lg font-semibold text-red-600';
  }

  const priceStatus = currentUser.priceActivationStatus;
  if (priceStatus === 'approved') {
    document.getElementById('priceActivationStatus').textContent = 'Activated';
    document.getElementById('priceActivationStatus').className = 'text-lg font-semibold text-green-600';
    document.getElementById('activationForm').classList.add('hidden');
    document.getElementById('activationPending').classList.add('hidden');
    document.getElementById('activationApproved').classList.remove('hidden');
    document.getElementById('priceSettingSection').classList.remove('hidden');

    if (currentUser.whatsappUnlockPrice) {
      document.getElementById('whatsappPriceInput').value = currentUser.whatsappUnlockPrice;
    }
  } else if (priceStatus === 'pending') {
    document.getElementById('priceActivationStatus').textContent = 'Pending Approval';
    document.getElementById('priceActivationStatus').className = 'text-lg font-semibold text-orange-600';
    document.getElementById('activationForm').classList.add('hidden');
    document.getElementById('activationPending').classList.remove('hidden');
  } else {
    document.getElementById('priceActivationStatus').textContent = 'Not Activated';
    document.getElementById('priceActivationStatus').className = 'text-lg font-semibold text-red-600';
  }

  const featuredStatus = currentUser.featuredStatus;
  if (featuredStatus === 'active' && currentUser.featured) {
    document.getElementById('featuredStatus').textContent = 'Active';
    document.getElementById('featuredStatus').className = 'text-lg font-semibold text-yellow-600';
    document.getElementById('boostForm').classList.add('hidden');
    document.getElementById('boostPending').classList.add('hidden');
    document.getElementById('boostActive').classList.remove('hidden');
    
    if (currentUser.featuredExpiry) {
      document.getElementById('boostExpiry').textContent = new Date(currentUser.featuredExpiry).toLocaleString();
    }
  } else if (featuredStatus === 'pending') {
    document.getElementById('featuredStatus').textContent = 'Pending';
    document.getElementById('featuredStatus').className = 'text-lg font-semibold text-orange-600';
    document.getElementById('boostForm').classList.add('hidden');
    document.getElementById('boostPending').classList.remove('hidden');
  } else {
    document.getElementById('featuredStatus').textContent = 'Not Featured';
    document.getElementById('featuredStatus').className = 'text-lg font-semibold text-gray-600';
  }
}

async function loadWallet() {
  try {
    const { balance, transactions } = await apiRequest('/api/user/wallet');
    document.getElementById('walletBalance').textContent = `$${(balance || 0).toFixed(2)}`;
    
    const historyDiv = document.getElementById('transactionHistory');
    if (transactions && transactions.length > 0) {
      historyDiv.innerHTML = transactions.map(t => `
        <div class="bg-gray-50 border rounded-lg p-3 text-sm">
          <div class="flex justify-between">
            <span class="font-medium">${t.type}</span>
            <span class="${t.amount >= 0 ? 'text-green-600' : 'text-red-600'} font-bold">
              ${t.amount >= 0 ? '+' : ''}$${Math.abs(t.amount / 100).toFixed(2)}
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-1">${new Date(t.createdAt).toLocaleString()}</div>
          ${t.description ? `<div class="text-xs text-gray-600 mt-1">${t.description}</div>` : ''}
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load wallet:', error);
  }
}

document.getElementById('btnSubmitActivation')?.addEventListener('click', async function() {
  const paymentMethod = document.getElementById('paymentMethod')?.value;
  const transactionRef = document.getElementById('transactionRef')?.value;

  if (!paymentMethod || !transactionRef) {
    alert('Please fill all fields');
    return;
  }

  try {
    await apiRequest('/api/user/price-activation', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, transactionRef }),
    });
    alert('Activation request submitted! Admin will review within 24-48 hours.');
    location.reload();
  } catch (error) {
    alert('Failed: ' + error.message);
  }
});

document.getElementById('btnSavePrices')?.addEventListener('click', async function() {
  const whatsappPrice = document.getElementById('whatsappPriceInput')?.value;
  const whatsappNumber = document.getElementById('whatsappNumberInput')?.value;

  if (!whatsappPrice) {
    alert('Please set a WhatsApp unlock price');
    return;
  }

  try {
    await apiRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ 
        whatsappUnlockPrice: parseInt(whatsappPrice),
        whatsappNumber: whatsappNumber || null,
      }),
    });
    alert('Prices saved successfully!');
  } catch (error) {
    alert('Failed: ' + error.message);
  }
});

document.getElementById('btnSubmitBoost')?.addEventListener('click', async function() {
  const boostPlan = document.getElementById('boostPlan')?.value;
  const boostPaymentMethod = document.getElementById('boostPaymentMethod')?.value;
  const boostTransactionRef = document.getElementById('boostTransactionRef')?.value;

  if (!boostPlan || !boostPaymentMethod || !boostTransactionRef) {
    alert('Please fill all fields');
    return;
  }

  try {
    await apiRequest('/api/user/featured-request', {
      method: 'POST',
      body: JSON.stringify({ 
        plan: boostPlan,
        paymentMethod: boostPaymentMethod,
        transactionRef: boostTransactionRef,
      }),
    });
    alert('Boost request submitted! Admin will review and activate your featured status.');
    location.reload();
  } catch (error) {
    alert('Failed: ' + error.message);
  }
});

document.getElementById('btnLogout').addEventListener('click', async function() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  } catch (error) {
    window.location.href = '/';
  }
});
