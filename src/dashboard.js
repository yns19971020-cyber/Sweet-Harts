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
    if (!user) {
      alert('Please login first');
      window.location.href = '/';
      return;
    }
    currentUser = user;
    
    // Admin gets special UI
    if (user.role === 'admin') {
      showAdminDashboard();
    } else {
      displayUserInfo();
      loadWallet();
    }
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
      historyDiv.textContent = '';
      transactions.forEach(t => {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 border rounded-lg p-3 text-sm';

        const row = document.createElement('div');
        row.className = 'flex justify-between';

        const typeSpan = document.createElement('span');
        typeSpan.className = 'font-medium';
        typeSpan.textContent = t.type;

        const amountSpan = document.createElement('span');
        amountSpan.className = (t.amount >= 0 ? 'text-green-600' : 'text-red-600') + ' font-bold';
        amountSpan.textContent = (t.amount >= 0 ? '+' : '') + '$' + Math.abs(t.amount / 100).toFixed(2);

        row.appendChild(typeSpan);
        row.appendChild(amountSpan);
        card.appendChild(row);

        const dateDiv = document.createElement('div');
        dateDiv.className = 'text-xs text-gray-500 mt-1';
        dateDiv.textContent = new Date(t.createdAt).toLocaleString();
        card.appendChild(dateDiv);

        if (t.description) {
          const descDiv = document.createElement('div');
          descDiv.className = 'text-xs text-gray-600 mt-1';
          descDiv.textContent = t.description;
          card.appendChild(descDiv);
        }

        historyDiv.appendChild(card);
      });
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
    
    messagesList.innerHTML = '';
    
    messages.forEach(msg => {
      const isFromMe = msg.senderId === currentUser.id;
      const time = new Date(msg.createdAt).toLocaleString('en-US', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      
      const wrapper = document.createElement('div');
      wrapper.className = `flex ${isFromMe ? 'justify-end' : 'justify-start'}`;
      
      const bubble = document.createElement('div');
      bubble.className = `max-w-[80%] ${isFromMe ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg p-3`;
      
      const messageText = document.createElement('p');
      messageText.className = 'text-sm';
      messageText.textContent = msg.message;
      bubble.appendChild(messageText);
      
      if (msg.attachment) {
        const img = document.createElement('img');
        img.className = 'mt-2 max-h-40 rounded';
        img.src = msg.attachment;
        bubble.appendChild(img);
      }
      
      const timeText = document.createElement('p');
      timeText.className = `text-xs ${isFromMe ? 'text-blue-100' : 'text-gray-500'} mt-1`;
      timeText.textContent = time;
      bubble.appendChild(timeText);
      
      wrapper.appendChild(bubble);
      messagesList.appendChild(wrapper);
    });
    
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

// Admin Dashboard Functions
function showAdminDashboard() {
  const container = document.querySelector('.max-w-4xl');
  container.innerHTML = `
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p class="text-blue-100 text-sm">View all users and verify profiles</p>
        </div>
        <div class="flex gap-2">
          <a href="/admin.html" class="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium">
            User Management
          </a>
          <a href="/" class="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-medium">
            View Site
          </a>
        </div>
      </div>
      
      <div class="p-6">
        <div class="mb-4 flex gap-2">
          <input type="text" id="searchUsers" placeholder="Search users..." class="flex-1 px-4 py-2 border rounded-lg">
          <select id="filterStatus" class="px-4 py-2 border rounded-lg">
            <option value="all">All Users</option>
            <option value="pending">Pending Verification</option>
            <option value="verified">Verified</option>
          </select>
        </div>
        
        <div id="adminUsersList" class="space-y-4">
          <p class="text-center text-gray-500 py-4">Loading users...</p>
        </div>
      </div>
    </div>
  `;
  
  loadAdminUsers();
  
  document.getElementById('searchUsers').addEventListener('input', filterAdminUsers);
  document.getElementById('filterStatus').addEventListener('change', filterAdminUsers);
}

let allUsers = [];

async function loadAdminUsers() {
  try {
    const { users } = await apiRequest('/api/admin/users');
    allUsers = users || [];
    renderAdminUsers(allUsers);
  } catch (error) {
    document.getElementById('adminUsersList').innerHTML = '<p class="text-red-500 text-center">Failed to load users</p>';
  }
}

function filterAdminUsers() {
  const search = document.getElementById('searchUsers').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;
  
  let filtered = allUsers;
  
  if (search) {
    filtered = filtered.filter(u => 
      u.username.toLowerCase().includes(search) || 
      u.email.toLowerCase().includes(search) ||
      (u.location && u.location.toLowerCase().includes(search))
    );
  }
  
  if (status === 'pending') {
    filtered = filtered.filter(u => !u.verified);
  } else if (status === 'verified') {
    filtered = filtered.filter(u => u.verified);
  }
  
  renderAdminUsers(filtered);
}

function renderAdminUsers(users) {
  const container = document.getElementById('adminUsersList');
  
  if (users.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-4">No users found</p>';
    return;
  }
  
  container.innerHTML = users.map(user => `
    <div class="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
      <div class="flex gap-4">
        <img src="${user.profileImage || 'https://via.placeholder.com/80'}" 
             alt="${user.username}" 
             class="w-20 h-20 rounded-lg object-cover border-2 ${user.verified ? 'border-green-500' : 'border-orange-400'}">
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-bold text-lg">${user.username}</h3>
              <p class="text-sm text-gray-500">${user.email}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-sm ${user.verified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}">
              ${user.verified ? '✓ Verified' : '⏳ Pending'}
            </span>
          </div>
          <div class="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
            <span>📁 ${user.category || 'N/A'}</span>
            <span>📍 ${user.location || 'N/A'}</span>
            <span>👤 ${user.gender || 'N/A'}</span>
            <span>📱 ${user.whatsapp || 'N/A'}</span>
          </div>
          <div class="mt-3 flex gap-2 flex-wrap">
            <a href="/profile.html?id=${user.id}" target="_blank" class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              View Profile
            </a>
            ${!user.verified ? `
              <button onclick="verifyUser('${user.id}')" class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                ✓ Verify
              </button>
            ` : ''}
            <button onclick="viewUserDetails('${user.id}')" class="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

window.verifyUser = async function(userId) {
  if (confirm('Verify this user?')) {
    try {
      await apiRequest(`/api/admin/users/${userId}/verify`, { method: 'PUT' });
      alert('User verified!');
      loadAdminUsers();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
};

window.viewUserDetails = async function(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;
  
  const details = `
User: ${user.username}
Email: ${user.email}
Category: ${user.category || 'N/A'}
Location: ${user.location || 'N/A'}
Gender: ${user.gender || 'N/A'}
WhatsApp: ${user.whatsapp || 'N/A'}
Bio: ${user.bio || 'N/A'}
Age: ${user.age || 'N/A'}
Verified: ${user.verified ? 'Yes' : 'No'}
Created: ${new Date(user.createdAt).toLocaleString()}
  `;
  alert(details);
};
