import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize localStorage structure if not exists
if (!localStorage.getItem('privateconnect_users')) {
  localStorage.setItem('privateconnect_users', JSON.stringify([]));
}

if (!localStorage.getItem('privateconnect_currentUser')) {
  localStorage.setItem('privateconnect_currentUser', JSON.stringify(null));
}

// Create default admin user
const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
if (!users.find((u: any) => u.email === 'admin@privateconnect.lk')) {
  users.push({
    id: 'admin-001',
    username: 'Admin',
    email: 'admin@privateconnect.lk',
    password: 'admin123',
    role: 'admin',
    gender: 'Male',
    category: 'Admin',
    verified: true,
    verifiedGender: 'Male',
    canSetPrice: true,
    priceActivationStatus: 'approved',
    blocked: false,
    createdAt: new Date().toISOString(),
    profileImage: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
  });
  localStorage.setItem('privateconnect_users', JSON.stringify(users));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
