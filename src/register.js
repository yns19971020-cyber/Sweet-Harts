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
    console.log('Current protocol:', window.location.protocol);
    console.log('Is secure context:', window.isSecureContext);
    
    if (!window.isSecureContext) {
      alert('Camera requires HTTPS. Please access the site via HTTPS.\n\nකැමරාවට HTTPS අවශ්‍යයි. කරුණාකර HTTPS හරහා site එකට පිවිසෙන්න.');
      return;
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera access.\n\nඔබගේ browser එක camera support කරන්නේ නැත.');
      return;
    }
    
    const constraints = {
      video: {
        width: { ideal: 640, min: 320 },
        height: { ideal: 480, min: 240 },
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
    
    let errorMessage = 'Camera access failed.\nකැමරා ප්‍රවේශය අසාර්ථක විය.\n\n';
    
    if (err.name === 'NotAllowedError') {
      errorMessage += 'Please allow camera access in your browser settings.\nකරුණාකර browser settings වලින් camera access allow කරන්න.';
    } else if (err.name === 'NotFoundError') {
      errorMessage += 'No camera found on this device.\nමෙම device එකේ camera එකක් හමු නොවීය.';
    } else if (err.name === 'NotReadableError') {
      errorMessage += 'Camera is in use by another application.\nකැමරාව වෙනත් app එකකින් භාවිතා වෙමින් පවතී.';
    } else if (err.name === 'OverconstrainedError') {
      try {
        const fallbackConstraints = { video: true, audio: false };
        videoStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        videoPreview.srcObject = videoStream;
        await videoPreview.play();
        cameraPlaceholder.classList.add('hidden');
        videoPreview.classList.remove('hidden');
        btnOpenCamera.classList.add('hidden');
        btnCapture.classList.remove('hidden');
        console.log('Camera stream active with fallback constraints');
        return;
      } catch (fallbackErr) {
        errorMessage += 'Camera constraints not supported.\nකැමරා constraints support නැත.';
      }
    } else if (err.name === 'SecurityError' || err.name === 'TypeError') {
      errorMessage += 'Camera access blocked. HTTPS required.\nකැමරා ප්‍රවේශය block කර ඇත. HTTPS අවශ්‍යයි.';
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
  const uploadedPhoto = document.getElementById('uploadedPhoto');
  if (uploadedPhoto) uploadedPhoto.classList.add('hidden');
  btnRetake.classList.add('hidden');
  btnOpenCamera.classList.remove('hidden');
  const btnUploadPhoto = document.getElementById('btnUploadPhoto');
  if (btnUploadPhoto) btnUploadPhoto.classList.remove('hidden');
  cameraPlaceholder.classList.remove('hidden');
});

const fileUpload = document.getElementById('fileUpload');
const btnUploadPhoto = document.getElementById('btnUploadPhoto');
const uploadedPhoto = document.getElementById('uploadedPhoto');

console.log('=== UPLOAD BUTTON DEBUG ===');
console.log('btnUploadPhoto element:', btnUploadPhoto);
console.log('fileUpload element:', fileUpload);

window.handleFileSelect = function(e) {
  console.log('File selected via handleFileSelect');
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.\nකරුණාකර image file එකක් තෝරන්න.');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image too large. Maximum 5MB allowed.\nImage එක ලොකු වැඩි. Maximum 5MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    selfieData = event.target.result;
    selfieDataInput.value = selfieData;

    if (uploadedPhoto) {
      uploadedPhoto.src = selfieData;
      uploadedPhoto.classList.remove('hidden');
    }
    
    cameraPlaceholder.classList.add('hidden');
    capturedPhoto.classList.add('hidden');
    btnOpenCamera.classList.add('hidden');
    if (btnUploadPhoto) btnUploadPhoto.classList.add('hidden');
    btnRetake.classList.remove('hidden');

    console.log('Photo uploaded, size:', Math.round(selfieData.length / 1024), 'KB');
  };
  reader.readAsDataURL(file);
};

if (fileUpload) {
  console.log('File upload input found, adding change listener');
  fileUpload.addEventListener('change', window.handleFileSelect);
}

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

let paymentSlipData = '';

const paymentDetailsSection = document.getElementById('paymentDetails');
const bankDetailsDiv = document.getElementById('bankDetails');
const paymentSlipUpload = document.getElementById('paymentSlipUpload');
const paymentSlipPreview = document.getElementById('paymentSlipPreview');

if (paymentSlipUpload) {
  paymentSlipUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Slip image too large. Maximum 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      paymentSlipData = event.target.result;
      if (paymentSlipPreview) {
        paymentSlipPreview.src = paymentSlipData;
        paymentSlipPreview.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  });
}

paymentMethodSelect.addEventListener('change', async function() {
  const method = this.value;
  
  if (method && method !== 'online') {
    paymentDetailsSection.classList.remove('hidden');
    
    if (method === 'bank_sampath') {
      bankDetailsDiv.innerHTML = `
        <p><strong>Sampath Bank</strong></p>
        <p>Account: 105057458082</p>
        <p>Name: J A Y S Kavinda</p>
        <p>Branch: Kalutara</p>
      `;
    } else if (method === 'bank_commercial') {
      bankDetailsDiv.innerHTML = `
        <p><strong>Commercial Bank</strong></p>
        <p>Account: 8007739640</p>
        <p>Name: J A Y S Kavinda</p>
        <p>Branch: Kalutara</p>
      `;
    } else if (method === 'binance') {
      bankDetailsDiv.innerHTML = `
        <p><strong>Binance USDT (TRC20)</strong></p>
        <p>Wallet: TRC20 network address will be provided</p>
        <p>After payment, enter your TXID as reference</p>
      `;
    }
  } else if (method === 'online') {
    paymentDetailsSection.classList.add('hidden');
  } else {
    paymentDetailsSection.classList.add('hidden');
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

  if (paymentMethod !== 'online' && !transactionRef) {
    alert('කරුණාකර transaction reference අංකය ඇතුළත් කරන්න. (Please enter transaction reference.)');
    return;
  }

  if (paymentMethod !== 'online' && !paymentSlipData) {
    alert('කරුණාකර payment slip/screenshot upload කරන්න. (Please upload payment slip.)');
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
        paymentMethod,
        transactionRef,
        paymentProof: paymentSlipData,
      }),
    });

    alert('ලියාපදිංචිය සාර්ථකයි! ඔබගේ ගිණුම admin සත්‍යාපනය සඳහා පොරොත්තු වේ.\n\nRegistration successful! Your account is pending admin approval.');
    window.location.href = '/';
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
});
