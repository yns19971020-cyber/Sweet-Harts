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
    renderUsers();
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
          <img src="${user.profileImage || 'https://via.placeholder.com/40'}" alt="${user.username}" class="w-10 h-10 rounded-full mr-3 object-cover">
          <div>
            <div class="font-medium">${user.username}</div>
            <div class="text-sm text-gray-500">${user.email}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">${user.gender}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">${user.category}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="text-sm">${user.location || 'Not set'}</span>
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
        <button onclick="openUserModal('${user.id}')" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
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
