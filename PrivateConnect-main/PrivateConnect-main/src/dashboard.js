// Dashboard Page Handler
const currentUser = JSON.parse(localStorage.getItem('privateconnect_currentUser'));

if (!currentUser || currentUser.role === 'admin') {
  alert('Please login as a user');
  window.location.href = '../index.html';
}

// Display wallet balance
document.getElementById('walletBalance').textContent = `$${(currentUser.walletBalance || 0).toFixed(2)}`;

// Display subscription status
const subStatus = currentUser.subscriptionStatus || 'pending';
const subExpiry = currentUser.subscriptionExpiryDate;
if (subStatus === 'active') {
  document.getElementById('subscriptionStatus').textContent = `Active (${currentUser.subscriptionPlan})`;
  document.getElementById('subscriptionStatus').className = 'text-lg font-semibold text-green-600';
  if (subExpiry) {
    document.getElementById('subscriptionExpiry').textContent = `Expires: ${new Date(subExpiry).toLocaleDateString()}`;
  }
} else if (subStatus === 'pending') {
  document.getElementById('subscriptionStatus').textContent = 'Pending Approval';
  document.getElementById('subscriptionStatus').className = 'text-lg font-semibold text-orange-600';
} else {
  document.getElementById('subscriptionStatus').textContent = 'Expired';
  document.getElementById('subscriptionStatus').className = 'text-lg font-semibold text-red-600';
}

// Display transaction history
const transactions = currentUser.walletTransactions || [];
const historyDiv = document.getElementById('transactionHistory');
if (transactions.length > 0) {
  historyDiv.innerHTML = transactions.map(t => `
    <div class="bg-gray-50 border rounded-lg p-3 text-sm">
      <div class="flex justify-between">
        <span class="font-medium">${t.type}</span>
        <span class="${t.amount >= 0 ? 'text-green-600' : 'text-red-600'} font-bold">
          ${t.amount >= 0 ? '+' : ''}$${t.amount.toFixed(2)}
        </span>
      </div>
      <div class="text-xs text-gray-500 mt-1">${new Date(t.date).toLocaleString()}</div>
      ${t.description ? `<div class="text-xs text-gray-600 mt-1">${t.description}</div>` : ''}
    </div>
  `).reverse().join('');
}

// Bank account settings
document.getElementById('btnBankSettings').addEventListener('click', function() {
  const bankAccount = prompt('බැංකු ගිණුම් අංකය ඇතුළත් කරන්න (Enter your bank account number):', currentUser.bankAccount || '');
  if (bankAccount !== null) {
    const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    users[userIndex].bankAccount = bankAccount;
    localStorage.setItem('privateconnect_users', JSON.stringify(users));
    localStorage.setItem('privateconnect_currentUser', JSON.stringify(users[userIndex]));
    alert('බැංකු ගිණුම සුරකින ලදී! (Bank account saved!)');
  }
});

// Withdraw button
document.getElementById('btnWithdraw').addEventListener('click', function() {
  if (!currentUser.bankAccount) {
    alert('කරුණාකර පළමුව ඔබගේ බැංකු ගිණුම සකසන්න. (Please set up your bank account first.)');
    return;
  }
  
  const balance = currentUser.walletBalance || 0;
  if (balance <= 0) {
    alert('ශේෂය ප්‍රමාණවත් නොවේ. (Insufficient balance.)');
    return;
  }
  
  const amount = parseFloat(prompt(`මුදල් ගැනීමට අවශ්‍ය මුදල (Available: $${balance.toFixed(2)}):`, balance.toFixed(2)));
  if (amount && amount > 0 && amount <= balance) {
    const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    // Create withdrawal transaction
    const transaction = {
      type: 'Withdrawal Request',
      amount: -amount,
      date: new Date().toISOString(),
      description: `Withdrawal to bank account ${currentUser.bankAccount}`,
      status: 'pending'
    };
    
    users[userIndex].walletTransactions = users[userIndex].walletTransactions || [];
    users[userIndex].walletTransactions.push(transaction);
    
    localStorage.setItem('privateconnect_users', JSON.stringify(users));
    localStorage.setItem('privateconnect_currentUser', JSON.stringify(users[userIndex]));
    
    alert('මුදල් ගැනීමේ ඉල්ලීම admin අනුමැතිය සඳහා යවන ලදී. (Withdrawal request submitted for admin approval.)');
    location.reload();
  }
});

// Display account status
document.getElementById('verificationStatus').textContent = currentUser.verified ? 'Verified' : 'Pending';
document.getElementById('verificationStatus').className = currentUser.verified 
  ? 'text-lg font-semibold text-green-600' 
  : 'text-lg font-semibold text-orange-600';

document.getElementById('userCategory').textContent = currentUser.category;
document.getElementById('userLocation').textContent = currentUser.location || 'Not set';

// Price activation status
const priceStatus = currentUser.priceActivationStatus;
if (priceStatus === 'approved') {
  document.getElementById('priceActivationStatus').textContent = 'Activated';
  document.getElementById('priceActivationStatus').className = 'text-lg font-semibold text-green-600';
  document.getElementById('activationForm').classList.add('hidden');
  document.getElementById('activationPending').classList.add('hidden');
  document.getElementById('activationApproved').classList.remove('hidden');
  document.getElementById('priceSettingSection').classList.remove('hidden');

  // Load existing prices
  if (currentUser.chatPrice) document.getElementById('chatPriceInput').value = currentUser.chatPrice;
  if (currentUser.voicePrice) document.getElementById('voicePriceInput').value = currentUser.voicePrice;
  if (currentUser.videoPrice) document.getElementById('videoPriceInput').value = currentUser.videoPrice;

} else if (priceStatus === 'pending') {
  document.getElementById('priceActivationStatus').textContent = 'Pending Approval';
  document.getElementById('priceActivationStatus').className = 'text-lg font-semibold text-orange-600';
  document.getElementById('activationForm').classList.add('hidden');
  document.getElementById('activationPending').classList.remove('hidden');
} else {
  document.getElementById('priceActivationStatus').textContent = 'Not Activated';
  document.getElementById('priceActivationStatus').className = 'text-lg font-semibold text-red-600';
}

// Featured status
const featuredStatus = currentUser.featuredStatus;
if (featuredStatus === 'active' && currentUser.featured) {
  document.getElementById('featuredStatus').textContent = 'Active';
  document.getElementById('featuredStatus').className = 'text-lg font-semibold text-yellow-600';
  document.getElementById('boostForm').classList.add('hidden');
  document.getElementById('boostPending').classList.add('hidden');
  document.getElementById('boostActive').classList.remove('hidden');
  
  if (currentUser.featuredExpiry) {
    const expiry = new Date(currentUser.featuredExpiry).toLocaleString();
    document.getElementById('boostExpiry').textContent = expiry;
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

// Submit activation request
document.getElementById('btnSubmitActivation').addEventListener('click', function() {
  const paymentMethod = document.getElementById('paymentMethod').value;
  const transactionRef = document.getElementById('transactionRef').value;
  const paymentProofInput = document.getElementById('paymentProof');

  if (!paymentMethod || !transactionRef || !paymentProofInput.files[0]) {
    alert('Please fill all fields and upload payment proof');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    const paymentProof = event.target.result;

    // Update user
    const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    users[userIndex].priceActivationStatus = 'pending';
    users[userIndex].paymentMethod = paymentMethod;
    users[userIndex].transactionRef = transactionRef;
    users[userIndex].paymentProof = paymentProof;

    localStorage.setItem('privateconnect_users', JSON.stringify(users));
    localStorage.setItem('privateconnect_currentUser', JSON.stringify(users[userIndex]));

    alert('Activation request submitted! Admin will review within 24-48 hours.');
    location.reload();
  };

  reader.readAsDataURL(paymentProofInput.files[0]);
});

// Save prices
document.getElementById('btnSavePrices').addEventListener('click', function() {
  const chatPrice = document.getElementById('chatPriceInput').value;
  const voicePrice = document.getElementById('voicePriceInput').value;
  const videoPrice = document.getElementById('videoPriceInput').value;

  if (!chatPrice && !voicePrice && !videoPrice) {
    alert('Please set at least one price');
    return;
  }

  const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  
  users[userIndex].chatPrice = chatPrice ? parseInt(chatPrice) : null;
  users[userIndex].voicePrice = voicePrice ? parseInt(voicePrice) : null;
  users[userIndex].videoPrice = videoPrice ? parseInt(videoPrice) : null;

  localStorage.setItem('privateconnect_users', JSON.stringify(users));
  localStorage.setItem('privateconnect_currentUser', JSON.stringify(users[userIndex]));

  alert('Prices saved successfully!');
});

// Submit boost request
document.getElementById('btnSubmitBoost').addEventListener('click', function() {
  const boostPlan = document.getElementById('boostPlan').value;
  const boostPaymentMethod = document.getElementById('boostPaymentMethod').value;
  const boostTransactionRef = document.getElementById('boostTransactionRef').value;
  const boostPaymentProofInput = document.getElementById('boostPaymentProof');

  if (!boostPlan || !boostPaymentMethod || !boostTransactionRef || !boostPaymentProofInput.files[0]) {
    alert('Please fill all fields and upload payment proof');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    const boostPaymentProof = event.target.result;

    const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    users[userIndex].featuredStatus = 'pending';
    users[userIndex].featuredPlan = boostPlan;
    users[userIndex].featuredPaymentMethod = boostPaymentMethod;
    users[userIndex].featuredTransactionRef = boostTransactionRef;
    users[userIndex].featuredPaymentProof = boostPaymentProof;

    localStorage.setItem('privateconnect_users', JSON.stringify(users));
    localStorage.setItem('privateconnect_currentUser', JSON.stringify(users[userIndex]));

    alert('Boost request submitted! Admin will review and activate your featured status.');
    location.reload();
  };

  reader.readAsDataURL(boostPaymentProofInput.files[0]);
});

// Logout
document.getElementById('btnLogout').addEventListener('click', function() {
  localStorage.setItem('privateconnect_currentUser', JSON.stringify(null));
  window.location.href = '../index.html';
});
