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

let receiptData = '';

document.getElementById('btnContactAdmin').addEventListener('click', function() {
  document.getElementById('messageModal').classList.remove('hidden');
  loadMessages();
  loadUnreadCount();
});

document.getElementById('btnCloseMessageModal').addEventListener('click', function() {
  document.getElementById('messageModal').classList.add('hidden');
});

document.getElementById('receiptUpload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      receiptData = event.target.result;
      document.getElementById('receiptImage').src = receiptData;
      document.getElementById('receiptPreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('btnRemoveReceipt').addEventListener('click', function() {
  receiptData = '';
  document.getElementById('receiptUpload').value = '';
  document.getElementById('receiptPreview').classList.add('hidden');
});

document.getElementById('btnSendMessage').addEventListener('click', async function() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  
  if (!message && !receiptData) {
    alert('Please enter a message or attach a receipt');
    return;
  }
  
  try {
    await apiRequest('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        message: message || 'Payment Receipt Attached',
        messageType: receiptData ? 'receipt' : 'text',
        attachment: receiptData || null,
      }),
    });
    
    messageInput.value = '';
    receiptData = '';
    document.getElementById('receiptUpload').value = '';
    document.getElementById('receiptPreview').classList.add('hidden');
    
    loadMessages();
    alert('පණිවිඩය සාර්ථකව එවන ලදී! (Message sent successfully!)');
  } catch (error) {
    alert('Failed to send message: ' + error.message);
  }
});

async function loadMessages() {
  try {
    const { messages } = await apiRequest('/api/messages');
    const messagesList = document.getElementById('messagesList');
    
    if (!messages || messages.length === 0) {
      messagesList.innerHTML = '<p class="text-center text-gray-500 text-sm">No messages yet. Start a conversation!</p>';
      return;
    }
    
    messagesList.innerHTML = messages.map(msg => {
      const isFromMe = msg.senderId === currentUser.id;
      const time = new Date(msg.createdAt).toLocaleString('en-US', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      
      return `
        <div class="flex ${isFromMe ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] ${isFromMe ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg p-3">
            <p class="text-sm">${msg.message}</p>
            ${msg.attachment ? `<img src="${msg.attachment}" class="mt-2 max-h-40 rounded">` : ''}
            <p class="text-xs ${isFromMe ? 'text-blue-100' : 'text-gray-500'} mt-1">${time}</p>
          </div>
        </div>
      `;
    }).join('');
    
    messagesList.scrollTop = messagesList.scrollHeight;
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
}

async function loadUnreadCount() {
  try {
    const { unreadCount } = await apiRequest('/api/messages/unread');
    const badge = document.getElementById('unreadBadge');
    
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch (error) {
    console.error('Failed to load unread count:', error);
  }
}

loadUnreadCount();
