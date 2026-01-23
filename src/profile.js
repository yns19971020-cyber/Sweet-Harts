// Profile.js - WhatsApp Unlock System with Free Chat/Voice
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id');

if (!userId) {
  alert('Invalid profile');
  window.location.href = '../index.html';
}

const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
const user = users.find(u => u.id === userId);

if (!user || user.role === 'admin') {
  alert('Profile not found');
  window.location.href = '../index.html';
}

const currentUser = JSON.parse(localStorage.getItem('privateconnect_currentUser'));

// Display user info
document.getElementById('profileImage').src = user.profileImage || 'https://via.placeholder.com/200';
document.getElementById('profileUsername').textContent = user.username;
document.getElementById('profileGender').textContent = user.gender;
document.getElementById('profileCategory').textContent = user.category;
document.getElementById('profileLocation').textContent = user.location || 'Not specified';

if (user.verified) {
  document.getElementById('verifiedBadge').classList.remove('hidden');
  document.getElementById('profileStatus').textContent = 'Verified ✓';
  document.getElementById('profileStatus').className = 'text-lg font-semibold text-green-600';
} else {
  document.getElementById('profileStatus').textContent = 'Pending';
  document.getElementById('profileStatus').className = 'text-lg font-semibold text-orange-600';
}

if (user.featured && user.featuredStatus === 'active') {
  document.getElementById('featuredBadge').classList.remove('hidden');
}

// WhatsApp Unlock Price Display
const pricingSection = document.getElementById('pricingSection');
const notActivatedMessage = document.getElementById('notActivatedMessage');

if (user.canSetPrice && user.priceActivationStatus === 'approved' && user.whatsappUnlockPrice) {
  notActivatedMessage.classList.add('hidden');
  pricingSection.innerHTML = `
    <div class="col-span-full bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
      <h3 class="text-lg font-bold mb-4 text-green-800">✅ FREE සේවා (දැන්ම භාවිතා කරන්න)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div class="bg-white p-4 rounded-lg border border-green-300">
          <div class="text-sm text-gray-600 mb-1">💬 Private Chat</div>
          <div class="text-2xl font-bold text-green-600">නොමිලේ (FREE)</div>
          <div class="text-xs text-gray-500 mt-1">Message සීමාවකින් තොරව</div>
        </div>
        <div class="bg-white p-4 rounded-lg border border-green-300">
          <div class="text-sm text-gray-600 mb-1">📞 Voice Call</div>
          <div class="text-2xl font-bold text-green-600">නොමිලේ (FREE)</div>
          <div class="text-xs text-gray-500 mt-1">වෙබ්සයිට් එක හරහා</div>
        </div>
      </div>
    </div>

    <div class="col-span-full bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-300 mt-4">
      <h3 class="text-lg font-bold mb-3 text-blue-800">🎥 WhatsApp Video Call - Unlock කරන්න</h3>
      <div class="bg-white p-5 rounded-lg border border-blue-300">
        <div class="text-sm text-gray-600 mb-2">WhatsApp Contact Unlock මිල</div>
        <div class="text-3xl font-bold text-blue-600 mb-2">Rs. ${user.whatsappUnlockPrice}</div>
        <div class="text-sm text-gray-600">
          <p class="mb-2">✓ WhatsApp අංකය unlock කිරීමෙන්:</p>
          <ul class="list-disc list-inside text-xs text-gray-700 space-y-1">
            <li>WhatsApp හරහා Video Calls</li>
            <li>WhatsApp හරහා Photos & Files share</li>
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

// Contact Buttons
const lockMessage = document.getElementById('lockMessage');

if (!user.verified || !user.canSetPrice) {
  // Profile not activated
  lockMessage.classList.remove('hidden');
  lockMessage.innerHTML = '🔒 <strong>Profile Locked:</strong> This profile has not completed verification and activation yet.';
} else {
  lockMessage.classList.add('hidden');
  
  // Check if current user has unlocked WhatsApp
  const hasUnlockedWhatsApp = currentUser && currentUser.unlockedProfiles && currentUser.unlockedProfiles.includes(userId);

  // Replace buttons
  const buttonContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.gap-4');
  buttonContainer.innerHTML = `
    <button id="btnFreeChat" class="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
      💬 Free Chat
    </button>
    <button id="btnFreeVoice" class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
      📞 Free Voice Call
    </button>
    ${hasUnlockedWhatsApp 
      ? `<a href="https://wa.me/${user.whatsappNumber.replace(/[^0-9]/g, '')}" target="_blank" class="px-6 py-3 bg-green-500 text-white rounded-lg font-medium text-center hover:bg-green-600">
          🎥 WhatsApp අමතන්න
        </a>`
      : `<button id="btnUnlockWhatsApp" class="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
          🔓 Unlock WhatsApp (Rs.${user.whatsappUnlockPrice})
        </button>`
    }
  `;

  // Free Chat button
  document.getElementById('btnFreeChat').addEventListener('click', function() {
    if (!currentUser) {
      alert('කරුණාකර පළමුව login වන්න. (Please login first.)');
      window.location.href = '../index.html';
      return;
    }
    alert(`💬 Free Chat සමඟ ${user.username}\n\nChat feature එක එළඹෙන යාවත්කාලීනයෙන් available වේ! දැනට WhatsApp unlock කර භාවිතා කරන්න.`);
  });

  // Free Voice button
  document.getElementById('btnFreeVoice').addEventListener('click', function() {
    if (!currentUser) {
      alert('කරුණාකර පළමුව login වන්න. (Please login first.)');
      window.location.href = '../index.html';
      return;
    }
    alert(`📞 Free Voice Call සමඟ ${user.username}\n\nVoice call feature එක එළඹෙන යාවත්කාලීනයෙන් available වේ! දැනට WhatsApp unlock කර භාවිතා කරන්න.`);
  });

  // WhatsApp Unlock button (if not unlocked)
  const btnUnlock = document.getElementById('btnUnlockWhatsApp');
  if (btnUnlock) {
    btnUnlock.addEventListener('click', function() {
      if (!currentUser) {
        alert('කරුණාකර පළමුව login වන්න. (Please login first.)');
        window.location.href = '../index.html';
        return;
      }

      if (currentUser.id === user.id) {
        alert('ඔබේම profile එක unlock කළ නොහැක. (Cannot unlock your own profile.)');
        return;
      }

      // Show payment modal
      const paymentModal = document.createElement('div');
      paymentModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
      paymentModal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-xl font-bold mb-4">🔓 WhatsApp Contact Unlock</h3>
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">Profile: <strong>${user.username}</strong></p>
            <p class="text-lg font-bold text-blue-600">මිල: Rs. ${user.whatsappUnlockPrice}</p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">ගෙවීමේ ක්‍රමය *</label>
            <select id="unlockPaymentMethod" class="w-full px-3 py-2 border rounded-md">
              <option value="">-- ක්‍රමයක් තෝරන්න --</option>
              <option value="bank_sampath">Sampath Bank - 105057458082</option>
              <option value="bank_commercial">Commercial Bank - 8007739640</option>
              <option value="binance">Binance (USDT)</option>
            </select>
          </div>

          <div id="bankInfo" class="hidden mb-4 p-3 bg-blue-50 rounded-lg text-sm">
            <!-- Bank details will show here -->
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Transaction ID / Reference *</label>
            <input type="text" id="unlockTransactionRef" class="w-full px-3 py-2 border rounded-md" placeholder="Enter transaction ID">
          </div>

          <div class="flex gap-3">
            <button id="btnSubmitUnlock" class="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-medium">
              ගෙවීම තහවුරු කරන්න
            </button>
            <button id="btnCancelUnlock" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400">
              අවලංගු කරන්න
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(paymentModal);

      // Show bank details
      document.getElementById('unlockPaymentMethod').addEventListener('change', function() {
        const method = this.value;
        const bankInfo = document.getElementById('bankInfo');
        if (method === 'bank_sampath') {
          bankInfo.classList.remove('hidden');
          bankInfo.innerHTML = '<p><strong>Sampath Bank</strong><br>A/C: 105057458082<br>Name: J A Y S Kavinda</p>';
        } else if (method === 'bank_commercial') {
          bankInfo.classList.remove('hidden');
          bankInfo.innerHTML = '<p><strong>Commercial Bank</strong><br>A/C: 8007739640<br>Name: J A Y S Kavinda</p>';
        } else if (method === 'binance') {
          bankInfo.classList.remove('hidden');
          bankInfo.innerHTML = '<p><strong>Binance USDT</strong><br>After payment, enter TXID</p>';
        } else {
          bankInfo.classList.add('hidden');
        }
      });

      document.getElementById('btnCancelUnlock').addEventListener('click', function() {
        paymentModal.remove();
      });

      document.getElementById('btnSubmitUnlock').addEventListener('click', function() {
        const method = document.getElementById('unlockPaymentMethod').value;
        const ref = document.getElementById('unlockTransactionRef').value;

        if (!method || !ref) {
          alert('කරුණාකර සියලු තොරතුරු සම්පූර්ණ කරන්න. (Please fill all fields.)');
          return;
        }

        // Save unlock request
        const allUsers = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
        const currentUserIndex = allUsers.findIndex(u => u.id === currentUser.id);

        if (currentUserIndex === -1) {
          alert('Error: User not found');
          return;
        }

        // Initialize unlock requests if not exists
        if (!allUsers[currentUserIndex].unlockRequests) {
          allUsers[currentUserIndex].unlockRequests = [];
        }

        // Add unlock request
        allUsers[currentUserIndex].unlockRequests.push({
          targetUserId: user.id,
          targetUsername: user.username,
          amount: user.whatsappUnlockPrice,
          paymentMethod: method,
          transactionRef: ref,
          status: 'pending',
          requestDate: new Date().toISOString()
        });

        localStorage.setItem('privateconnect_users', JSON.stringify(allUsers));
        localStorage.setItem('privateconnect_currentUser', JSON.stringify(allUsers[currentUserIndex]));

        alert(`✅ WhatsApp unlock request submitted!\n\nAdmin එක approve කළ පසු WhatsApp contact එක unlock වේ.\n\nඔබේ wallet එකෙන් Rs.${user.whatsappUnlockPrice} අඩු වේ (10% commission සමඟ).`);
        paymentModal.remove();
        location.reload();
      });
    });
  }
}
