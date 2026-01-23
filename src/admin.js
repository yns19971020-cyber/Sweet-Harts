// Admin Panel Handler
const currentUser = JSON.parse(localStorage.getItem('privateconnect_currentUser'));

if (!currentUser || currentUser.role !== 'admin') {
  alert('Admin access only');
  window.location.href = '../index.html';
}

let users = [];
let selectedUser = null;
let currentFilter = 'all';

loadUsers();

// Tab filtering
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

function loadUsers() {
  users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]')
    .filter(u => u.role !== 'admin');
  renderUsers();
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
          <img src="${user.profileImage || 'https://via.placeholder.com/40'}" alt="${user.username}" class="w-10 h-10 rounded-full mr-3">
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
          ? '<span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">⭐ Active</span>'
          : user.featuredStatus === 'pending'
          ? '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">Pending</span>'
          : '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">None</span>'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${user.subscriptionStatus === 'pending' 
          ? '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">⏳ Payment Pending</span>'
          : user.subscriptionStatus === 'active'
          ? '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">✓ Active</span>'
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

  // Display the live selfie photo captured during registration
  const profileImageSrc = selectedUser.profileImage || 'https://via.placeholder.com/150';
  document.getElementById('modalUserImage').src = profileImageSrc;
  console.log('📸 Displaying user selfie photo:', profileImageSrc.substring(0, 50) + '...');
  document.getElementById('modalUsername').textContent = selectedUser.username;
  document.getElementById('modalEmail').textContent = selectedUser.email;
  document.getElementById('modalGender').textContent = selectedUser.gender;
  document.getElementById('modalCategory').textContent = selectedUser.category;
  document.getElementById('modalLocation').textContent = selectedUser.location || 'Not set';
  
  console.log('User verification details:', {
    username: selectedUser.username,
    gender: selectedUser.gender,
    category: selectedUser.category,
    verified: selectedUser.verified,
    hasSelfie: !!selectedUser.profileImage
  });
  document.getElementById('modalCategorySelect').value = selectedUser.category;
  document.getElementById('modalLocationSelect').value = selectedUser.location || 'Colombo';

  // Show subscription payment if pending
  const existingSubDiv = document.querySelector('.subscription-approval-section');
  if (existingSubDiv) existingSubDiv.remove();
  
  if (selectedUser.subscriptionStatus === 'pending') {
    const subDiv = document.createElement('div');
    subDiv.className = 'subscription-approval-section mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg';
    subDiv.innerHTML = `
      <h4 class="font-semibold mb-2">💳 Subscription Payment Approval</h4>
      <p class="text-sm">Plan: <strong>${selectedUser.subscriptionPlan} - $${selectedUser.subscriptionPrice}</strong></p>
      <p class="text-sm">Payment Method: ${selectedUser.subscriptionPaymentMethod}</p>
      <p class="text-sm">Transaction Ref: ${selectedUser.subscriptionTransactionRef}</p>
      <div class="mt-3 flex gap-2">
        <button onclick="approveSubscription('${selectedUser.id}')" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">✓ Approve Payment</button>
        <button onclick="rejectSubscription('${selectedUser.id}')" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">✗ Reject</button>
      </div>
    `;
    document.getElementById('userModal').querySelector('.overflow-y-auto > div').appendChild(subDiv);
  }

  // Show activation request if pending
  if (selectedUser.priceActivationStatus === 'pending') {
    document.getElementById('activationRequestSection').classList.remove('hidden');
    document.getElementById('modalPaymentMethod').textContent = selectedUser.paymentMethod || '-';
    document.getElementById('modalTransactionRef').textContent = selectedUser.transactionRef || '-';
    document.getElementById('modalPaymentProof').src = selectedUser.paymentProof || '';
  } else {
    document.getElementById('activationRequestSection').classList.add('hidden');
  }

  // Show featured request if pending
  if (selectedUser.featuredStatus === 'pending') {
    document.getElementById('featuredRequestSection').classList.remove('hidden');
    document.getElementById('modalFeaturedPlan').textContent = selectedUser.featuredPlan || '-';
    document.getElementById('modalFeaturedPaymentMethod').textContent = selectedUser.featuredPaymentMethod || '-';
    document.getElementById('modalFeaturedTransactionRef').textContent = selectedUser.featuredTransactionRef || '-';
    document.getElementById('modalFeaturedPaymentProof').src = selectedUser.featuredPaymentProof || '';
  } else {
    document.getElementById('featuredRequestSection').classList.add('hidden');
  }

  document.getElementById('userModal').classList.remove('hidden');
};

// Approve subscription payment
window.approveSubscription = function(userId) {
  if (confirm('Approve this subscription payment?')) {
    updateUser(userId, {
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date().toISOString()
    });
    alert('Subscription approved and activated!');
    closeModalAndRefresh();
  }
};

// Reject subscription payment
window.rejectSubscription = function(userId) {
  if (confirm('Reject this subscription payment?')) {
    updateUser(userId, {
      subscriptionStatus: 'rejected'
    });
    alert('Subscription payment rejected');
    closeModalAndRefresh();
  }
};

document.getElementById('btnCloseModal').addEventListener('click', () => {
  document.getElementById('userModal').classList.add('hidden');
});

document.getElementById('btnVerifyMale').addEventListener('click', () => verifyUser('Male'));
document.getElementById('btnVerifyFemale').addEventListener('click', () => verifyUser('Female'));
document.getElementById('btnRejectVerification').addEventListener('click', () => rejectUser());

function verifyUser(gender) {
  updateUser(selectedUser.id, {
    verified: true,
    verifiedGender: gender
  });
  alert(`User verified as ${gender}`);
  closeModalAndRefresh();
}

function rejectUser() {
  if (confirm('Reject this user verification?')) {
    updateUser(selectedUser.id, {
      verified: false,
      verifiedGender: null
    });
    alert('User verification rejected');
    closeModalAndRefresh();
  }
}

document.getElementById('btnUpdateCategoryLocation').addEventListener('click', () => {
  const newCategory = document.getElementById('modalCategorySelect').value;
  const newLocation = document.getElementById('modalLocationSelect').value;
  updateUser(selectedUser.id, { 
    category: newCategory,
    location: newLocation
  });
  alert('Category and location updated');
  closeModalAndRefresh();
});

document.getElementById('btnApproveActivation').addEventListener('click', () => {
  updateUser(selectedUser.id, {
    priceActivationStatus: 'approved',
    canSetPrice: true
  });
  alert('Price activation approved!');
  closeModalAndRefresh();
});

document.getElementById('btnRejectActivation').addEventListener('click', () => {
  if (confirm('Reject activation request?')) {
    updateUser(selectedUser.id, {
      priceActivationStatus: 'rejected',
      canSetPrice: false
    });
    alert('Activation request rejected');
    closeModalAndRefresh();
  }
});

document.getElementById('btnApproveFeature').addEventListener('click', () => {
  // Calculate expiry based on plan
  let expiryDate = new Date();
  const plan = selectedUser.featuredPlan;
  
  if (plan === '24 Hours') {
    expiryDate.setHours(expiryDate.getHours() + 24);
  } else if (plan === '3 Days') {
    expiryDate.setDate(expiryDate.getDate() + 3);
  } else if (plan === '7 Days') {
    expiryDate.setDate(expiryDate.getDate() + 7);
  }

  updateUser(selectedUser.id, {
    featured: true,
    featuredStatus: 'active',
    featuredExpiry: expiryDate.toISOString()
  });
  alert(`Featured status approved! Will expire on ${expiryDate.toLocaleString()}`);
  closeModalAndRefresh();
});

document.getElementById('btnRejectFeature').addEventListener('click', () => {
  if (confirm('Reject featured request?')) {
    updateUser(selectedUser.id, {
      featured: false,
      featuredStatus: 'rejected'
    });
    alert('Featured request rejected');
    closeModalAndRefresh();
  }
});

document.getElementById('btnBlockUser').addEventListener('click', () => {
  if (confirm('Block this user? They will not be able to login.')) {
    updateUser(selectedUser.id, { blocked: true });
    alert('User blocked');
    closeModalAndRefresh();
  }
});

function updateUser(userId, updates) {
  const allUsers = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
  const index = allUsers.findIndex(u => u.id === userId);
  if (index !== -1) {
    allUsers[index] = { ...allUsers[index], ...updates };
    localStorage.setItem('privateconnect_users', JSON.stringify(allUsers));
  }
}

function closeModalAndRefresh() {
  document.getElementById('userModal').classList.add('hidden');
  loadUsers();
}

document.getElementById('btnAdminLogout').addEventListener('click', () => {
  localStorage.setItem('privateconnect_currentUser', JSON.stringify(null));
  window.location.href = '../index.html';
});
