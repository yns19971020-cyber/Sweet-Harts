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

let selfieData = '';
let videoStream = null;

const videoPreview = document.getElementById('cameraPreview');
const capturedPhoto = document.getElementById('capturedPhoto');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const btnOpenCamera = document.getElementById('btnOpenCamera');
const btnCapture = document.getElementById('btnCapture');
const btnRetake = document.getElementById('btnRetake');
const selfieDataInput = document.getElementById('selfieData');

console.log('=== CAMERA SYSTEM DEBUG INFO ===');
console.log('URL:', window.location.href);
console.log('Protocol:', window.location.protocol);
console.log('Hostname:', window.location.hostname);

const isSecureContext = window.location.protocol === 'https:' || 
                        window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
console.log(isSecureContext ? 'Protocol OK: Localhost' : 'Protocol requires HTTPS');

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  console.log('Browser supports camera API');
} else {
  console.log('Browser does NOT support camera API');
}

if (navigator.permissions) {
  navigator.permissions.query({ name: 'camera' })
    .then(result => {
      console.log('Camera permission status:', result.state);
      if (result.state === 'granted') {
        console.log('Camera permission already granted');
      } else if (result.state === 'prompt') {
        console.log('Camera permission will be requested when user clicks button');
      } else {
        console.log('Camera permission denied by user or browser settings');
      }
    })
    .catch(err => {
      console.log('Cannot query camera permission:', err.message);
    });
}

navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    console.log('Video devices found:', videoDevices.length);
    if (videoDevices.length === 0) {
      console.log('No camera devices found');
    }
  })
  .catch(err => {
    console.log('Cannot enumerate devices:', err.message);
  });

console.log('=== END DEBUG INFO ===');

btnOpenCamera.addEventListener('click', async function() {
  try {
    console.log('Requesting camera access...');
    
    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      },
      audio: false
    };

    videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('Camera access granted');
    
    videoPreview.srcObject = videoStream;
    await videoPreview.play();
    
    cameraPlaceholder.classList.add('hidden');
    videoPreview.classList.remove('hidden');
    btnOpenCamera.classList.add('hidden');
    btnCapture.classList.remove('hidden');
    
    console.log('Camera stream active');
  } catch (err) {
    console.error('Camera error:', err.name, err.message);
    
    let errorMessage = 'Camera access failed. ';
    
    if (err.name === 'NotAllowedError') {
      errorMessage += 'Please allow camera access in your browser settings.';
    } else if (err.name === 'NotFoundError') {
      errorMessage += 'No camera found on this device.';
    } else if (err.name === 'NotReadableError') {
      errorMessage += 'Camera is in use by another application.';
    } else if (err.name === 'OverconstrainedError') {
      errorMessage += 'Camera constraints not satisfied.';
    } else if (err.name === 'SecurityError') {
      errorMessage += 'Camera access blocked. HTTPS required.';
    } else {
      errorMessage += err.message;
    }
    
    alert(errorMessage);
  }
});

btnCapture.addEventListener('click', function() {
  const canvas = capturedPhoto;
  canvas.width = videoPreview.videoWidth || 640;
  canvas.height = videoPreview.videoHeight || 480;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);
  
  selfieData = canvas.toDataURL('image/jpeg', 0.8);
  selfieDataInput.value = selfieData;
  
  console.log('Selfie captured, size:', Math.round(selfieData.length / 1024), 'KB');
  
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  
  videoPreview.classList.add('hidden');
  btnCapture.classList.add('hidden');
  capturedPhoto.classList.remove('hidden');
  btnRetake.classList.remove('hidden');
});

btnRetake.addEventListener('click', function() {
  selfieData = '';
  selfieDataInput.value = '';
  capturedPhoto.classList.add('hidden');
  btnRetake.classList.add('hidden');
  btnOpenCamera.classList.remove('hidden');
  cameraPlaceholder.classList.remove('hidden');
});

const paymentMethodSelect = document.getElementById('paymentMethod');
const bankDetailsSection = document.getElementById('bankDetailsSection');
const bankDetailsContent = document.getElementById('bankDetailsContent');

function renderBankDetails(container, bankDetails) {
  container.textContent = '';
  
  const bankNameP = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = bankDetails.bankName;
  bankNameP.appendChild(strong);
  
  const accountP = document.createElement('p');
  accountP.textContent = 'Account: ' + bankDetails.accountNumber;
  
  const nameP = document.createElement('p');
  nameP.textContent = 'Name: ' + bankDetails.accountName;
  
  const branchP = document.createElement('p');
  branchP.textContent = 'Branch: ' + bankDetails.branch;
  
  container.appendChild(bankNameP);
  container.appendChild(accountP);
  container.appendChild(nameP);
  container.appendChild(branchP);
}

paymentMethodSelect.addEventListener('change', async function() {
  const method = this.value;
  
  if (method === 'sampath_bank') {
    bankDetailsSection.classList.remove('hidden');
    const response = await fetch('/api/bank-details?bank=sampath');
    const bankDetails = await response.json();
    renderBankDetails(bankDetailsContent, bankDetails);
  } else if (method === 'commercial_bank') {
    bankDetailsSection.classList.remove('hidden');
    const response = await fetch('/api/bank-details?bank=commercial');
    const bankDetails = await response.json();
    renderBankDetails(bankDetailsContent, bankDetails);
  } else if (method === 'binance') {
    bankDetailsSection.classList.remove('hidden');
    bankDetailsContent.innerHTML = `
      <p><strong>Binance USDT (TRC20)</strong></p>
      <p>Wallet: TRC20 network address will be provided</p>
      <p>After payment, enter your TXID as reference</p>
    `;
  } else {
    bankDetailsSection.classList.add('hidden');
  }
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const gender = document.querySelector('input[name="gender"]:checked')?.value;
  const category = document.getElementById('category').value;
  const location = document.getElementById('location').value;
  const ageConfirm = document.getElementById('ageConfirm').checked;
  const termsAccept = document.getElementById('termsAccept').checked;
  const selectedPlan = document.querySelector('input[name="plan"]:checked');
  const paymentMethod = document.getElementById('paymentMethod').value;
  const transactionRef = document.getElementById('transactionRef').value;

  if (!gender) {
    alert('කරුණාකර ස්ත්‍රී/පුරුෂ භාවය තෝරන්න. (Please select gender.)');
    return;
  }

  if (!category) {
    alert('කරුණාකර ප්‍රවර්ගයක් තෝරන්න. (Please select a category.)');
    return;
  }

  if (!location) {
    alert('කරුණාකර ස්ථානයක් තෝරන්න. (Please select a location.)');
    return;
  }

  if (!selfieData) {
    alert('කරුණාකර කැමරාවෙන් සෙල්ෆි ඡායාරූපයක් ගන්න. (Please capture a selfie photo using the camera.)');
    return;
  }

  if (!selectedPlan) {
    alert('කරුණාකර subscription plan එකක් තෝරන්න. (Please select a subscription plan.)');
    return;
  }

  if (!paymentMethod) {
    alert('කරුණාකර ගෙවීමේ ක්‍රමයක් තෝරන්න. (Please select a payment method.)');
    return;
  }

  if (!transactionRef) {
    alert('කරුණාකර transaction reference අංකය ඇතුළත් කරන්න. (Please enter transaction reference.)');
    return;
  }

  if (!ageConfirm) {
    alert('ඔබ වයස අවුරුදු 18 ට වැඩි බව සහතික කළ යුතුය. (You must confirm you are 18 years or older.)');
    return;
  }

  if (!termsAccept) {
    alert('කරුණාකර නීතිරීති වලට එකඟ වන්න. (Please accept the terms and conditions.)');
    return;
  }

  try {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
        gender,
        category,
        location,
        profileImage: selfieData,
        subscriptionPlan: selectedPlan.value,
      }),
    });

    alert('ලියාපදිංචිය සාර්ථකයි! ඔබගේ ගිණුම admin සත්‍යාපනය සඳහා පොරොත්තු වේ.\n\nRegistration successful! Your account is pending admin approval.');
    window.location.href = '/';
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
});
