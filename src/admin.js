const API_BASE = '';

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createStatusBadge(text, colorClass) {
  const span = document.createElement('span');
  span.className = `px-2 py-1 text-xs font-medium ${colorClass} rounded`;
  span.textContent = text;
  return span;
}

function createTableCell(className = 'px-6 py-4 whitespace-nowrap') {
  const td = document.createElement('td');
  td.className = className;
  return td;
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

let users = [];
let selectedUser = null;
let currentFilter = 'all';

checkAuth();
loadUsers();

async function checkAuth() {
  try {
    const { user } = await apiRequest('/api/auth/me');
    if (!user || user.role !== 'admin') {
      alert('Admin access only');
      window.location.href = '/';
    }
  } catch (error) {
    alert('Please login as admin');
    window.location.href = '/';
  }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active', 'border-blue-600', 'text-blue-600');
      b.classList.add('text-gray-600');
    });
    this.classList.add('active', 'border-blue-600', 'text-blue-600');
    this.classList.remove('text-gray-600');
    
    currentFilter = this.dataset.filter;
    
    const messagesSection = document.getElementById('messagesSection');
    const usersTable = document.querySelector('.bg-white.rounded-lg.shadow-lg.overflow-hidden');
    const paymentsSection = document.getElementById('paymentsSection');
    const whatsappUnlocksSection = document.getElementById('whatsappUnlocksSection');
    
    // Hide all sections first
    paymentsSection.classList.add('hidden');
    messagesSection.classList.add('hidden');
    whatsappUnlocksSection.classList.add('hidden');
    usersTable.classList.add('hidden');
    
    if (currentFilter === 'payments') {
      paymentsSection.classList.remove('hidden');
      loadPayments();
    } else if (currentFilter === 'whatsappUnlocks') {
      whatsappUnlocksSection.classList.remove('hidden');
      loadWhatsappUnlocks();
    } else if (currentFilter === 'messages') {
      messagesSection.classList.remove('hidden');
      loadMessages();
    } else {
      usersTable.classList.remove('hidden');
      renderUsers();
    }
  });
});

async function loadUsers() {
  try {
    const { users: allUsers } = await apiRequest('/api/admin/users');
    users = allUsers.filter(u => u.role !== 'admin');
    renderUsers();
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}

function renderUsers() {
  let filteredUsers = users;

  if (currentFilter === 'pending') {
    filteredUsers = users.filter(u => !u.verified);
  } else if (currentFilter === 'verified') {
    filteredUsers = users.filter(u => u.verified);
  } else if (currentFilter === 'activation') {
    filteredUsers = users.filter(u => u.priceActivationStatus === 'pending');
  } else if (currentFilter === 'featured') {
    filteredUsers = users.filter(u => u.featuredStatus === 'pending');
  }

  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';

  filteredUsers.forEach(user => {
    const tr = document.createElement('tr');

    const tdUser = createTableCell();
    const userContainer = document.createElement('div');
    userContainer.className = 'flex items-center';
    const img = document.createElement('img');
    img.src = user.profileImage || 'https://via.placeholder.com/40';
    img.alt = user.username || '';
    img.className = 'w-10 h-10 rounded-full mr-3 object-cover';
    const userInfo = document.createElement('div');
    const userName = document.createElement('div');
    userName.className = 'font-medium';
    userName.textContent = user.username || '';
    const userEmail = document.createElement('div');
    userEmail.className = 'text-sm text-gray-500';
    userEmail.textContent = user.email || '';
    userInfo.appendChild(userName);
    userInfo.appendChild(userEmail);
    userContainer.appendChild(img);
    userContainer.appendChild(userInfo);
    tdUser.appendChild(userContainer);
    tr.appendChild(tdUser);

    const tdGender = createTableCell();
    tdGender.textContent = user.gender || '';
    tr.appendChild(tdGender);

    const tdCategory = createTableCell();
    tdCategory.appendChild(createStatusBadge(user.category || '', 'bg-blue-100 text-blue-800'));
    tr.appendChild(tdCategory);

    const tdLocation = createTableCell();
    const locationSpan = document.createElement('span');
    locationSpan.className = 'text-sm';
    locationSpan.textContent = user.location || 'Not set';
    tdLocation.appendChild(locationSpan);
    tr.appendChild(tdLocation);

    const tdVerified = createTableCell();
    tdVerified.appendChild(user.verified
      ? createStatusBadge('Verified', 'bg-green-100 text-green-800')
      : createStatusBadge('Pending', 'bg-orange-100 text-orange-800'));
    tr.appendChild(tdVerified);

    const tdPriceStatus = createTableCell();
    if (user.priceActivationStatus === 'approved') {
      tdPriceStatus.appendChild(createStatusBadge('Activated', 'bg-green-100 text-green-800'));
    } else if (user.priceActivationStatus === 'pending') {
      tdPriceStatus.appendChild(createStatusBadge('Pending', 'bg-yellow-100 text-yellow-800'));
    } else {
      tdPriceStatus.appendChild(createStatusBadge('None', 'bg-gray-100 text-gray-800'));
    }
    tr.appendChild(tdPriceStatus);

    const tdFeatured = createTableCell();
    if (user.featured && user.featuredStatus === 'active') {
      tdFeatured.appendChild(createStatusBadge('Active', 'bg-yellow-100 text-yellow-800'));
    } else if (user.featuredStatus === 'pending') {
      tdFeatured.appendChild(createStatusBadge('Pending', 'bg-orange-100 text-orange-800'));
    } else {
      tdFeatured.appendChild(createStatusBadge('None', 'bg-gray-100 text-gray-800'));
    }
    tr.appendChild(tdFeatured);

    const tdSubscription = createTableCell();
    if (user.subscriptionStatus === 'pending') {
      tdSubscription.appendChild(createStatusBadge('Payment Pending', 'bg-orange-100 text-orange-800'));
    } else if (user.subscriptionStatus === 'active') {
      tdSubscription.appendChild(createStatusBadge('Active', 'bg-green-100 text-green-800'));
    } else {
      tdSubscription.appendChild(createStatusBadge('Expired', 'bg-red-100 text-red-800'));
    }
    tr.appendChild(tdSubscription);

    const tdActions = createTableCell();
    const manageBtn = document.createElement('button');
    manageBtn.className = 'px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700';
    manageBtn.textContent = 'Manage';
    manageBtn.addEventListener('click', () => openUserModal(user.id));
    tdActions.appendChild(manageBtn);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

window.openUserModal = function(userId) {
  selectedUser = users.find(u => u.id === userId);
  if (!selectedUser) return;

  document.getElementById('modalUserImage').src = selectedUser.profileImage || 'https://via.placeholder.com/150';
  document.getElementById('modalUsername').textContent = selectedUser.username;
  document.getElementById('modalEmail').textContent = selectedUser.email;
  document.getElementById('modalGender').textContent = selectedUser.gender;
  document.getElementById('modalCategory').textContent = selectedUser.category;
  document.getElementById('modalLocation').textContent = selectedUser.location || 'Not set';
  
  document.getElementById('modalCategorySelect').value = selectedUser.category;
  document.getElementById('modalLocationSelect').value = selectedUser.location || 'Colombo';

  document.getElementById('userModal').classList.remove('hidden');
};

document.getElementById('btnCloseModal').addEventListener('click', () => {
  document.getElementById('userModal').classList.add('hidden');
});

document.getElementById('btnVerifyMale').addEventListener('click', () => verifyUser('Male'));
document.getElementById('btnVerifyFemale').addEventListener('click', () => verifyUser('Female'));
document.getElementById('btnRejectVerification').addEventListener('click', () => rejectUser());

async function verifyUser(gender) {
  try {
    await apiRequest(`/api/admin/users/${selectedUser.id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verified: true, verifiedGender: gender }),
    });
    alert(`User verified as ${gender}`);
    closeModalAndRefresh();
  } catch (error) {
    alert('Failed: ' + error.message);
  }
}

async function rejectUser() {
  if (confirm('Reject this user verification?')) {
    try {
      await apiRequest(`/api/admin/users/${selectedUser.id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ verified: false, verifiedGender: null }),
      });
      alert('User verification rejected');
      closeModalAndRefresh();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  }
}

document.getElementById('btnBlockUser').addEventListener('click', async () => {
  if (confirm('Block this user?')) {
    try {
      await apiRequest(`/api/admin/users/${selectedUser.id}/block`, {
        method: 'PUT',
        body: JSON.stringify({ blocked: true }),
      });
      alert('User blocked');
      closeModalAndRefresh();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  }
});

async function closeModalAndRefresh() {
  document.getElementById('userModal').classList.add('hidden');
  await loadUsers();
}

document.getElementById('btnAdminLogout').addEventListener('click', async () => {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  } catch (error) {
    window.location.href = '/';
  }
});

let adminId = null;

async function loadMessages() {
  try {
    const { user } = await apiRequest('/api/auth/me');
    adminId = user.id;
    
    const { messages } = await apiRequest('/api/admin/messages');
    const messagesList = document.getElementById('messagesList');
    
    if (!messages || messages.length === 0) {
      messagesList.innerHTML = '<p class="text-gray-500 text-center py-4">No messages yet</p>';
      return;
    }

    const groupedMessages = {};
    messages.forEach(msg => {
      const otherUserId = msg.senderId === adminId ? msg.receiverId : msg.senderId;
      if (!groupedMessages[otherUserId]) {
        groupedMessages[otherUserId] = [];
      }
      groupedMessages[otherUserId].push(msg);
    });

    let html = '';
    for (const [userId, msgs] of Object.entries(groupedMessages)) {
      const user = users.find(u => u.id === userId);
      const userName = user ? user.username : 'Unknown User';
      const unreadCount = msgs.filter(m => !m.isRead && m.senderId === userId).length;
      
      const safeProfileImage = user?.profileImage && !user.profileImage.toLowerCase().startsWith('javascript:') ? escapeHtml(user.profileImage) : 'https://via.placeholder.com/40';
      const safeUserName = escapeHtml(userName);
      html += `
        <div class="border rounded-lg p-4 bg-gray-50">
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center gap-3">
              <img src="${safeProfileImage}" alt="${safeUserName}" class="w-10 h-10 rounded-full object-cover">
              <div>
                <h3 class="font-semibold">${safeUserName}</h3>
                <p class="text-xs text-gray-500">${msgs.length} messages</p>
              </div>
            </div>
            ${unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs rounded-full px-2 py-1">${unreadCount} new</span>` : ''}
          </div>
          <div class="space-y-2 max-h-60 overflow-y-auto">
            ${msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(msg => {
              const isFromUser = msg.senderId !== adminId;
              const safeAttachment = msg.attachment && !msg.attachment.toLowerCase().startsWith('javascript:') ? escapeHtml(msg.attachment) : '';
              return `
              <div class="p-2 rounded ${isFromUser ? 'bg-blue-100' : 'bg-green-100 ml-8'} text-sm">
                <p class="text-xs font-semibold ${isFromUser ? 'text-blue-700' : 'text-green-700'}">${isFromUser ? 'User' : 'Admin (You)'}</p>
                <p>${escapeHtml(msg.message)}</p>
                ${safeAttachment ? `<img src="${safeAttachment}" class="mt-2 max-h-40 rounded border cursor-pointer" onclick="window.open('${safeAttachment}', '_blank')">` : ''}
                <p class="text-xs text-gray-500 mt-1">${new Date(msg.createdAt).toLocaleString()}</p>
              </div>
            `}).join('')}
          </div>
          <div class="mt-3 flex gap-2">
            <input type="text" id="reply-${escapeHtml(userId)}" placeholder="Reply to user..." class="flex-1 px-3 py-2 border rounded-md text-sm">
            <button onclick="sendReply('${escapeHtml(userId)}')" class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Send</button>
          </div>
        </div>
      `;
    }
    
    if (typeof DOMPurify === 'undefined') {
      console.error('DOMPurify is required for safe HTML rendering');
      messagesList.textContent = 'Unable to load messages securely. Please refresh the page.';
      return;
    }
    messagesList.innerHTML = DOMPurify.sanitize(html);
  } catch (error) {
    console.error('Failed to load messages:', error);
    document.getElementById('messagesList').innerHTML = '<p class="text-red-500 text-center py-4">Failed to load messages</p>';
  }
}

window.sendReply = async function(userId) {
  const input = document.getElementById(`reply-${userId}`);
  const message = input.value.trim();
  
  if (!message) {
    alert('Please enter a message');
    return;
  }
  
  try {
    await apiRequest(`/api/admin/messages/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    
    input.value = '';
    loadMessages();
    alert('Reply sent!');
  } catch (error) {
    alert('Failed to send reply: ' + error.message);
  }
};

async function loadPayments() {
  try {
    const { payments } = await apiRequest('/api/admin/subscription-payments');
    const paymentsList = document.getElementById('paymentsList');
    
    if (!payments || payments.length === 0) {
      paymentsList.innerHTML = '<p class="text-gray-500 text-center py-4">No pending payments</p>';
      return;
    }

    const badge = document.getElementById('paymentsBadge');
    if (badge) {
      badge.textContent = payments.length;
      badge.classList.remove('hidden');
    }

    let html = '';
    for (const payment of payments) {
      const user = payment.user;
      const safeProfileImage = user?.profileImage && !user.profileImage.toLowerCase().startsWith('javascript:') ? escapeHtml(user.profileImage) : 'https://via.placeholder.com/60';
      const safeUserName = escapeHtml(user?.username || 'Unknown');
      const safeEmail = escapeHtml(user?.email || '');
      const safePaymentProof = payment.paymentProof && !payment.paymentProof.toLowerCase().startsWith('javascript:') ? escapeHtml(payment.paymentProof) : '';
      
      html += `
        <div class="border rounded-lg p-4 bg-gray-50">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-shrink-0">
              <img src="${safeProfileImage}" alt="${safeUserName}" class="w-20 h-20 rounded-lg object-cover border">
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-lg">${safeUserName}</h3>
              <p class="text-sm text-gray-500">${safeEmail}</p>
              <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div><span class="font-medium">Plan:</span> ${escapeHtml(payment.plan)}</div>
                <div><span class="font-medium">Amount:</span> $${(payment.amount / 100).toFixed(2)}</div>
                <div><span class="font-medium">Method:</span> ${escapeHtml(payment.paymentMethod || 'N/A')}</div>
                <div><span class="font-medium">Ref:</span> ${escapeHtml(payment.transactionRef || 'N/A')}</div>
              </div>
            </div>
            ${safePaymentProof ? `
              <div class="flex-shrink-0">
                <p class="text-xs font-medium mb-1">Payment Slip:</p>
                <img src="${safePaymentProof}" class="max-h-32 rounded border cursor-pointer hover:opacity-80" onclick="window.open('${safePaymentProof}', '_blank')" alt="Payment proof">
              </div>
            ` : '<div class="text-sm text-gray-400">No slip uploaded</div>'}
          </div>
          <div class="mt-4 flex gap-2">
            <button onclick="approvePayment('${escapeHtml(payment.id)}', '${escapeHtml(payment.userId)}', '${escapeHtml(payment.plan)}')" class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
              ✓ Approve & Activate
            </button>
            <button onclick="rejectPayment('${escapeHtml(payment.id)}')" class="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
              ✗ Reject
            </button>
          </div>
        </div>
      `;
    }
    
    if (typeof DOMPurify === 'undefined') {
      paymentsList.textContent = 'Unable to load payments securely.';
      return;
    }
    paymentsList.innerHTML = DOMPurify.sanitize(html);
  } catch (error) {
    console.error('Failed to load payments:', error);
    document.getElementById('paymentsList').innerHTML = '<p class="text-red-500 text-center py-4">Failed to load payments</p>';
  }
}

window.approvePayment = async function(paymentId, userId, plan) {
  if (confirm('Approve this payment and activate subscription?')) {
    try {
      await apiRequest(`/api/admin/subscription-payments/${paymentId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ userId, plan }),
      });
      alert('Payment approved! User subscription activated.');
      loadPayments();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  }
};

window.rejectPayment = async function(paymentId) {
  if (confirm('Reject this payment?')) {
    alert('Payment rejection feature coming soon. Please contact user directly.');
  }
};

async function loadWhatsappUnlocks() {
  try {
    const { unlocks } = await apiRequest('/api/admin/whatsapp-unlocks');
    const unlocksList = document.getElementById('whatsappUnlocksList');
    
    if (!unlocks || unlocks.length === 0) {
      unlocksList.innerHTML = '<p class="text-gray-500 text-center py-4">No pending WhatsApp unlock requests</p>';
      return;
    }

    const badge = document.getElementById('whatsappBadge');
    if (badge) {
      badge.textContent = unlocks.length;
      badge.classList.remove('hidden');
    }

    let html = '';
    for (const unlock of unlocks) {
      const buyer = unlock.buyer;
      const seller = unlock.seller;
      const safeBuyerImage = buyer?.profileImage && !buyer.profileImage.toLowerCase().startsWith('javascript:') ? escapeHtml(buyer.profileImage) : 'https://via.placeholder.com/50';
      const safeSellerImage = seller?.profileImage && !seller.profileImage.toLowerCase().startsWith('javascript:') ? escapeHtml(seller.profileImage) : 'https://via.placeholder.com/50';
      const safePaymentProof = unlock.paymentProof && !unlock.paymentProof.toLowerCase().startsWith('javascript:') ? escapeHtml(unlock.paymentProof) : '';
      
      html += `
        <div class="border rounded-lg p-4 bg-purple-50">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex items-center gap-3">
              <div class="text-center">
                <img src="${safeBuyerImage}" alt="${escapeHtml(buyer?.username || 'Buyer')}" class="w-12 h-12 rounded-full object-cover border-2 border-blue-400 mx-auto">
                <p class="text-xs font-medium mt-1">${escapeHtml(buyer?.username || 'Unknown')}</p>
                <p class="text-xs text-gray-500">Buyer</p>
              </div>
              <span class="text-2xl">→</span>
              <div class="text-center">
                <img src="${safeSellerImage}" alt="${escapeHtml(seller?.username || 'Seller')}" class="w-12 h-12 rounded-full object-cover border-2 border-pink-400 mx-auto">
                <p class="text-xs font-medium mt-1">${escapeHtml(seller?.username || 'Unknown')}</p>
                <p class="text-xs text-gray-500">Seller</p>
              </div>
            </div>
            <div class="flex-1">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div><span class="font-medium">Amount:</span> Rs.${unlock.amount}</div>
                <div><span class="font-medium">Method:</span> ${escapeHtml(unlock.paymentMethod || 'N/A')}</div>
                <div><span class="font-medium">Ref:</span> ${escapeHtml(unlock.transactionRef || 'N/A')}</div>
                <div><span class="font-medium">Access:</span> 1 Day</div>
              </div>
            </div>
            ${safePaymentProof ? `
              <div class="flex-shrink-0">
                <p class="text-xs font-medium mb-1">Payment Slip:</p>
                <img src="${safePaymentProof}" class="max-h-24 rounded border cursor-pointer hover:opacity-80" onclick="window.open('${safePaymentProof}', '_blank')" alt="Payment proof">
              </div>
            ` : '<div class="text-sm text-gray-400">No slip</div>'}
          </div>
          <div class="mt-3 flex gap-2">
            <button onclick="approveWhatsappUnlock('${escapeHtml(unlock.id)}', ${unlock.amount})" class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
              ✓ Approve (1 Day Access)
            </button>
            <button onclick="rejectWhatsappUnlock('${escapeHtml(unlock.id)}')" class="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
              ✗ Reject
            </button>
          </div>
        </div>
      `;
    }
    
    if (typeof DOMPurify === 'undefined') {
      unlocksList.textContent = 'Unable to load unlock requests securely.';
      return;
    }
    unlocksList.innerHTML = DOMPurify.sanitize(html);
  } catch (error) {
    console.error('Failed to load WhatsApp unlocks:', error);
    document.getElementById('whatsappUnlocksList').innerHTML = '<p class="text-red-500 text-center py-4">Failed to load unlock requests</p>';
  }
}

window.approveWhatsappUnlock = async function(unlockId, amount) {
  if (confirm('Approve this WhatsApp unlock? User will get 1 day access and seller will receive Rs.' + amount)) {
    try {
      await apiRequest(`/api/admin/whatsapp-unlocks/${unlockId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      alert('Approved! User now has 1 day access to seller WhatsApp.');
      loadWhatsappUnlocks();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  }
};

window.rejectWhatsappUnlock = async function(unlockId) {
  if (confirm('Reject this unlock request?')) {
    alert('Rejection feature coming soon.');
  }
};
