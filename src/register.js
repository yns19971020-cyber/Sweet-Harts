// ============================================
// LIVE SELFIE CAMERA (MANDATORY - NO UPLOAD)
// ============================================
let stream = null;
let capturedImageData = null;

const video = document.getElementById('cameraPreview');
const canvas = document.getElementById('capturedPhoto');
const placeholder = document.getElementById('cameraPlaceholder');
const btnOpenCamera = document.getElementById('btnOpenCamera');
const btnCapture = document.getElementById('btnCapture');
const btnRetake = document.getElementById('btnRetake');
const selfieDataInput = document.getElementById('selfieData');

// Check environment and permissions on page load
window.addEventListener('DOMContentLoaded', async function() {
  console.log('\n=== 📸 CAMERA SYSTEM DEBUG INFO ===');
  console.log('🌐 URL:', window.location.href);
  console.log('🔒 Protocol:', window.location.protocol);
  console.log('🏠 Hostname:', window.location.hostname);
  
  // Check HTTPS (required except for localhost)
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';
  const isHTTPS = window.location.protocol === 'https:';
  
  if (!isLocalhost && !isHTTPS) {
    console.error('❌ HTTPS අවශ්‍යයි! (HTTPS required!)');
    alert('⚠️ කැමරාව භාවිතා කිරීමට HTTPS connection එකක් අවශ්‍යයි!\n\n✅ විසඳුම:\n1. Site එක PUBLISH කරන්න\n2. Published URL එකෙන් test කරන්න\n\n(HTTPS required for camera. Please publish site to test.)');
  } else {
    console.log('✅ Protocol OK:', isLocalhost ? 'Localhost' : 'HTTPS');
  }
  
  // Check browser support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('❌ Browser camera API සහාය නොදක්වයි');
    alert('❌ Browser එක camera සහාය නොදක්වයි!\n\nකරුණාකර:\n• Chrome, Firefox, හෝ Safari භාවිතා කරන්න\n• Browser එක update කරන්න');
  } else {
    console.log('✅ Browser supports camera API');
    
    // Check permission status (if supported)
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' });
        console.log('📹 Camera permission status:', result.state);
        
        if (result.state === 'denied') {
          alert('🚫 කැමරා අවසර ප්‍රතික්ෂේප කර ඇත!\n\nකරුණාකර:\n1. Browser settings වලින් camera permissions allow කරන්න\n2. Address bar එකේ 🔒 icon click කරන්න\n3. Camera permissions "Allow" කරන්න\n4. Page එක refresh කරන්න');
        } else if (result.state === 'prompt') {
          console.log('ℹ️ Camera permission will be requested when user clicks button');
        } else if (result.state === 'granted') {
          console.log('✅ Camera permission already granted');
        }
      }
    } catch (err) {
      console.log('ℹ️ Permission API not available:', err.message);
    }
  }
  
  // Check if camera devices are available
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    console.log('📷 Video devices found:', videoDevices.length);
    
    if (videoDevices.length === 0) {
      console.error('❌ කැමරා උපකරණ සොයාගත නොහැක');
      alert('❌ කැමරාවක් සොයාගත නොහැක!\n\nකරුණාකර:\n• කැමරාව සම්බන්ධ කර ඇති බව පරීක්ෂා කරන්න\n• වෙනත් programs කැමරාව භාවිතා නොකරන බව සත්‍යාපනය කරන්න');
    } else {
      console.log('✅ කැමරා devices available');
      videoDevices.forEach((device, i) => {
        console.log(`  ${i + 1}. ${device.label || 'Camera ' + (i + 1)}`);
      });
    }
  } catch (err) {
    console.error('❌ Error checking devices:', err);
  }
  
  console.log('=== END DEBUG INFO ===\n');
});

// Function to open camera
async function openCamera() {
  try {
    console.log('\n🎥 [STEP 1] Opening camera...');
    console.log('⏰ Time:', new Date().toLocaleTimeString());
    
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ [ERROR] Browser API not supported');
      showCameraError('unsupported');
      return;
    }
    console.log('✅ [STEP 2] Browser API supported');

    // Request front camera access (MANDATORY)
    console.log('🔄 [STEP 3] Requesting camera permission...');
    stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'user', // Front camera ONLY
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    
    console.log('✅ [STEP 4] Camera access granted!');
    console.log('📹 Stream details:', {
      active: stream.active,
      id: stream.id,
      tracks: stream.getTracks().length
    });
    
    // Show camera preview
    console.log('🔄 [STEP 5] Setting up video preview...');
    video.srcObject = stream;
    await video.play();
    console.log('✅ [STEP 6] Video playing');
    
    // Update UI
    placeholder.classList.add('hidden');
    video.classList.remove('hidden');
    btnOpenCamera.classList.add('hidden');
    btnCapture.classList.remove('hidden');
    
    console.log('✅ [SUCCESS] Camera opened successfully! 🎉\n');
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-3';
    successMsg.innerHTML = '✅ කැමරාව සාර්ථකව විවෘත විය! (Camera opened successfully!)';
    video.parentElement.insertBefore(successMsg, video);
    setTimeout(() => successMsg.remove(), 3000);
    
  } catch (err) {
    console.error('\n❌ [ERROR] Camera failed to open');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Full error:', err);
    handleCameraError(err);
  }
}

// Show camera error with detailed Sinhala instructions
function showCameraError(type) {
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  const isHTTPS = window.location.protocol === 'https:';
  
  let errorMsg = `❌ කැමරාව සහාය නොදක්වයි!

⚠️ LIVE SELFIE එක අනිවාර්යයි

📱 කරුණාකර:
1. Chrome හෝ Safari browser භාවිතා කරන්න
2. Browser එක update කරන්න
3. වෙනත් programs කැමරාව භාවිතා නොකරන බව පරීක්ෂා කරන්න`;
  
  if (!isLocalhost && !isHTTPS) {
    errorMsg += `\n\n🔒 HTTPS අවශ්‍යයි!
✅ Site එක PUBLISH කර test කරන්න`;
  }
  
  errorMsg += `\n\n(Camera not supported. Use updated Chrome/Safari with HTTPS.)`;
  
  alert(errorMsg);
}

// Handle camera errors with detailed debugging
function handleCameraError(err) {
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';
  const isHTTPS = window.location.protocol === 'https:';
  
  let errorMsg = '❌ කැමරාව විවෘත කළ නොහැක!\n\n';
  let solution = '';
  
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    errorMsg += `🔒 කැමරා අවසර ප්‍රතික්ෂේප කරන ලදී!

📱 විසඳුම් 3:

1️⃣ Browser Settings හරහා:
   • Browser Settings > Privacy > Camera
   • PrivateConnect allow කරන්න
   • Page එක refresh කරන්න

2️⃣ Address Bar හරහා:
   • Address bar එකේ 🔒 lock icon click කරන්න
   • "Camera" permissions හොයන්න
   • "Allow" select කරන්න
   • Page එක reload කරන්න

3️⃣ Browser Restart:
   • Browser එක සම්පූර්ණයෙන් close කරන්න
   • Browser එක නැවත open කරන්න
   • Site එකට යන්න සහ camera allow කරන්න`;
    
    if (!isLocalhost && !isHTTPS) {
      errorMsg += `\n\n⚠️ HTTPS අවශ්‍යයි!
✅ Site එක PUBLISH කර test කරන්න`;
    }
    
    errorMsg += `\n\n(Camera permission denied. Please allow camera access in browser settings.)`;
    
  } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    errorMsg += `📷 කැමරාවක් සොයාගත නොහැක!

🔍 පරීක්ෂා කරන්න:
• කැමරාව device එකට properly connected වී ඇද්ද?
• වෙනත් apps (Zoom, Teams, Skype) කැමරාව භාවිතා කරනවාද?
• Device Manager වල camera enabled වී ඇද්ද?
• External camera නම් USB cable ප්‍රතිස්ථාපනය කරන්න

💡 උත්සාහ කරන්න:
1. වෙනත් apps වසන්න
2. Browser restart කරන්න
3. Device restart කරන්න

(No camera device found. Check if camera is connected and not being used by other apps.)`;
    
  } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    errorMsg += `⚠️ කැමරාව වෙනත් application එකකින් භාවිතා වේ!

🔍 වසන්න:
• Zoom, Microsoft Teams, Skype
• Facebook Messenger calls
• Other browser tabs using camera
• Video recording software

💡 විසඳුම:
1. ඉහත apps වසන්න
2. Browser එකේ වෙනත් camera භාවිතා කරන tabs වසන්න
3. Browser restart කරන්න
4. දැන් නැවත උත්සාහ කරන්න

(Camera is being used by another application. Close other apps and try again.)`;
    
  } else if (err.name === 'SecurityError') {
    errorMsg += `🔐 ආරක්ෂිත සම්බන්ධතාවයක් අවශ්‍යයි!

🌐 Current URL: ${window.location.href}
🔒 Protocol: ${window.location.protocol}

`;
    
    if (!isLocalhost && !isHTTPS) {
      errorMsg += `❌ HTTP භාවිතා වේ - Camera වැඩ නොකරයි!

✅ විසඳුම:
1. Site එක PUBLISH කරන්න (Top right "Publish" button)
2. Published .onspace.app URL එකෙන් test කරන්න
3. HTTPS භාවිතා වේ - Camera වැඩ කරයි!

🏠 හෝ VS Code වල:
• localhost හෝ 127.0.0.1 භාවිතා කරන්න
• file:// protocol භාවිතා නොකරන්න`;
    } else {
      errorMsg += `⚠️ Security error occurred on ${isLocalhost ? 'localhost' : 'HTTPS'}

කරුණාකර:
• Browser settings check කරන්න
• Antivirus/Firewall camera access block කරනවාද පරීක්ෂා කරන්න`;
    }
    
    errorMsg += `\n\n(HTTPS or localhost required for camera access.)`;
    
  } else if (err.name === 'OverconstrainedError') {
    errorMsg += `⚠️ Requested camera settings ලබා ගත නොහැක!

කරුණාකර:
• වෙනත් camera device එකක් භාවිතා කරන්න
• Browser update කරන්න

(Camera constraints not supported by device.)`;
    
  } else if (err.name === 'TypeError') {
    errorMsg += `⚠️ Camera API error!

කරුණාකර:
• Browser එක update කරන්න
• වෙනත් browser එකක උත්සාහ කරන්න (Chrome/Firefox)

(Camera API error. Update browser or try different browser.)`;
    
  } else {
    errorMsg += `⚠️ Unknown Error!

Error Name: ${err.name}
Error Message: ${err.message}

📝 Debug Info:
• Browser: ${navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/)?.[0] || 'Unknown'}
• Protocol: ${window.location.protocol}
• Hostname: ${window.location.hostname}

💡 උත්සාහ කරන්න:
1. Browser restart කරන්න
2. Device restart කරන්න
3. වෙනත් browser එකක test කරන්න`;
    
    if (!isLocalhost && !isHTTPS) {
      errorMsg += `\n4. Site එක PUBLISH කර test කරන්න (HTTPS)`;
    }
  }
  
  console.error('\n🚨 CAMERA ERROR DETAILS 🚨');
  console.error('Error:', errorMsg);
  console.error('Full error object:', err);
  
  alert(errorMsg);
}

// Manual camera open button
btnOpenCamera.addEventListener('click', openCamera);

// AUTO-OPEN camera on page load (optional - uncomment to enable)
// window.addEventListener('load', function() {
//   setTimeout(openCamera, 1000);
// });

// Capture live photo from camera
btnCapture.addEventListener('click', function() {
  if (!video.videoWidth || !video.videoHeight) {
    alert('⚠️ කැමරාව ready නැත. කරුණාකර රැඳී සිටින්න.\n(Camera not ready. Please wait.)');
    return;
  }

  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Draw current video frame to canvas
  context.drawImage(video, 0, 0);
  
  // Convert to base64 (LIVE PHOTO ONLY)
  capturedImageData = canvas.toDataURL('image/jpeg', 0.85);
  selfieDataInput.value = capturedImageData;
  
  console.log('✅ Live selfie captured:', capturedImageData.substring(0, 50) + '...');
  
  // Stop camera stream to save resources
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  
  // Show captured image
  video.classList.add('hidden');
  canvas.classList.remove('hidden');
  btnCapture.classList.add('hidden');
  btnRetake.classList.remove('hidden');
  
  alert('✅ ඡායාරූපය ගන්නා ලදී!\n(Photo captured successfully!)');
});

// Retake photo (re-open camera)
btnRetake.addEventListener('click', function() {
  // Clear captured data
  capturedImageData = null;
  selfieDataInput.value = '';
  
  // Reset UI
  canvas.classList.add('hidden');
  placeholder.classList.remove('hidden');
  btnRetake.classList.add('hidden');
  btnOpenCamera.classList.remove('hidden');
  
  console.log('🔄 Retake requested - camera will reopen');
});

// Stop camera stream when leaving page
window.addEventListener('beforeunload', function() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});

// Show payment details based on selection
document.getElementById('paymentMethod').addEventListener('change', function() {
  const paymentDetails = document.getElementById('paymentDetails');
  const bankDetails = document.getElementById('bankDetails');
  const method = this.value;
  
  if (method) {
    paymentDetails.classList.remove('hidden');
    
    if (method === 'bank_sampath') {
      bankDetails.innerHTML = `
        <p><strong>බැංකුව:</strong> Sampath Bank</p>
        <p><strong>ගිණුම් අංකය:</strong> 105057458082</p>
        <p><strong>ගිණුම් නම:</strong> J A Y S Kavinda</p>
        <p class="text-xs text-gray-600 mt-2">මුදල් transfer කිරීමෙන් පසු transaction අංකය ඇතුළත් කරන්න</p>
      `;
    } else if (method === 'bank_commercial') {
      bankDetails.innerHTML = `
        <p><strong>බැංකුව:</strong> Commercial Bank</p>
        <p><strong>ගිණුම් අංකය:</strong> 8007739640</p>
        <p><strong>ගිණුම් නම:</strong> J A Y S Kavinda</p>
        <p class="text-xs text-gray-600 mt-2">මුදල් transfer කිරීමෙන් පසු transaction අංකය ඇතුළත් කරන්න</p>
      `;
    } else if (method === 'binance') {
      bankDetails.innerHTML = `
        <p><strong>Payment Method:</strong> Binance USDT</p>
        <p class="text-xs text-gray-600 mt-2">USDT ගෙවීමෙන් පසු TXID ඇතුළත් කරන්න</p>
      `;
    } else if (method === 'online') {
      bankDetails.innerHTML = `
        <p><strong>Online Payment</strong></p>
        <p class="text-xs text-gray-600 mt-2">Online payment gateway integration will be available soon</p>
      `;
    }
  } else {
    paymentDetails.classList.add('hidden');
  }
});

// Registration Form Handler
document.getElementById('registerForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const category = document.getElementById('category').value;
  const location = document.getElementById('location').value;
  const ageConfirm = document.getElementById('ageConfirm').checked;
  const termsAccept = document.getElementById('termsAccept').checked;
  const selfieData = document.getElementById('selfieData').value;
  const selectedPlan = document.querySelector('input[name="plan"]:checked');
  const paymentMethod = document.getElementById('paymentMethod').value;
  const transactionRef = document.getElementById('transactionRef').value;

  // Validation
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

  // Check if email already exists
  const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
  if (users.find(u => u.email === email)) {
    alert('Email දැනටමත් ලියාපදිංචි වී ඇත. (Email already registered.)');
    return;
  }

  // Calculate subscription expiry
  const planValue = selectedPlan.value;
  const planPrice = selectedPlan.dataset.price;
  const now = new Date();
  let expiryDate = new Date(now);
  
  if (planValue === '1month') expiryDate.setMonth(expiryDate.getMonth() + 1);
  else if (planValue === '3months') expiryDate.setMonth(expiryDate.getMonth() + 3);
  else if (planValue === '6months') expiryDate.setMonth(expiryDate.getMonth() + 6);
  else if (planValue === '12months') expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  // Create user object with wallet
  const newUser = {
      id: 'user_' + Date.now(),
      username,
      email,
      password,
      gender,
      category,
      location,
      role: 'user',
      verified: false,
      verifiedGender: null,
      canSetPrice: false,
      priceActivationStatus: 'none',
      paymentMethod: null,
      transactionRef: null,
      paymentProof: null,
      whatsappUnlockPrice: null,
      whatsappNumber: null,
      blocked: false,
      featured: false,
      featuredStatus: 'none',
      featuredPlan: null,
      featuredExpiry: null,
      featuredPaymentMethod: null,
      featuredTransactionRef: null,
      featuredPaymentProof: null,
      profileImage: selfieData, // Captured selfie
      // Subscription details
      subscriptionPlan: planValue,
      subscriptionPrice: planPrice,
      subscriptionPaymentMethod: paymentMethod,
      subscriptionTransactionRef: transactionRef,
      subscriptionStatus: 'pending', // pending, active, expired
      subscriptionStartDate: null,
      subscriptionExpiryDate: expiryDate.toISOString(),
      // Wallet system
      walletBalance: 0,
      walletTransactions: [],
      bankAccount: null, // Will be set later by user
      // WhatsApp system
      whatsappUnlockPrice: null,
      whatsappNumber: null,
      unlockedProfiles: [], // IDs of profiles this user has unlocked
      unlockRequests: [], // Pending unlock payment requests
      description: 'Free chat & voice available. Unlock WhatsApp for video calls!',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('privateconnect_users', JSON.stringify(users));

    alert('ලියාපදිංචිය සාර්ථකයි! ඔබගේ ගිණුම admin සත්‍යාපනය සඳහා පොරොත්තු වේ.\n\nRegistration successful! Your account and subscription payment are pending admin approval.');
    window.location.href = '/';
  }
});
