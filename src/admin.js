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
    
    if (currentFilter === 'messages') {
      messagesSection.classList.remove('hidden');
      usersTable.classList.add('hidden');
      loadMessages();
    } else {
      messagesSection.classList.add('hidden');
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
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <img src="${escapeHtml(user.profileImage) || 'https://via.placeholder.com/40'}" alt="${escapeHtml(user.username)}" class="w-10 h-10 rounded-full mr-3 object-cover">
          <div>
            <div class="font-medium">${escapeHtml(user.username)}</div>
            <div class="text-sm text-gray-500">${escapeHtml(user.email)}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">${escapeHtml(user.gender)}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">${escapeHtml(user.category)}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="text-sm">${escapeHtml(user.location) || 'Not set'}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${user.verified 
          ? '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Verified</span>'
          : '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">Pending</span>'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${user.priceActivationStatus === 'approved' 
          ? '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Activated</span>'
          : user.priceActivationStatus === 'pending'
          ? '<span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Pending</span>'
          : '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">None</span>'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${user.featured && user.featuredStatus === 'active'
          ? '<span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Active</span>'
          : user.featuredStatus === 'pending'
          ? '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">Pending</span>'
          : '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">None</span>'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${user.subscriptionStatus === 'pending' 
          ? '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">Payment Pending</span>'
          : user.subscriptionStatus === 'active'
          ? '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Active</span>'
          : '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Expired</span>'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <button onclick="openUserModal('${escapeHtml(user.id)}')" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          Manage
        </button>
      </td>
    `;
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
            <input type="text" id="reply-${userId}" placeholder="Reply to user..." class="flex-1 px-3 py-2 border rounded-md text-sm">
            <button onclick="sendReply('${userId}')" class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Send</button>
          </div>
        </div>
      `;
    }
    
    messagesList.innerHTML = html;
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
