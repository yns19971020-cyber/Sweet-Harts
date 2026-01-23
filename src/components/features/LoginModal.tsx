import { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export default function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;

    if (!email || !password) {
      setError('කරුණාකර email සහ password ඇතුළත් කරන්න');
      return;
    }

    // Special admin access for jayakodyarachchigemahisha@gmail.com
    if (email === 'jayakodyarachchigemahisha@gmail.com') {
      const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
      const adminUser = users.find((u: any) => u.email === email && u.role === 'admin');
      
      if (!adminUser) {
        // Create admin user if not exists
        const newAdmin = {
          id: 'admin_main',
          username: 'Admin',
          email: 'jayakodyarachchigemahisha@gmail.com',
          password: password,
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
        users.push(newAdmin);
        localStorage.setItem('privateconnect_users', JSON.stringify(users));
        localStorage.setItem('privateconnect_currentUser', JSON.stringify(newAdmin));
        window.location.href = '/admin.html';
        return;
      }
      
      if (adminUser.password !== password) {
        setError('Invalid admin password');
        return;
      }
      
      localStorage.setItem('privateconnect_currentUser', JSON.stringify(adminUser));
      window.location.href = '/admin.html';
      return;
    }

    const users = JSON.parse(localStorage.getItem('privateconnect_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password && u.role !== 'admin');

    if (!user) {
      setError('Invalid credentials');
      return;
    }

    if (user.blocked) {
      setError('Your account has been blocked');
      return;
    }

    localStorage.setItem('privateconnect_currentUser', JSON.stringify(user));
    onLogin();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Login / පිවිසීම</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              ref={emailRef}
              type="email"
              className="input-field"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              ref={passwordRef}
              type="password"
              className="input-field"
              placeholder="Enter your password"
              required
            />
          </div>

          <button onClick={handleLogin} className="w-full btn-primary">
            Login / පිවිසෙන්න
          </button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <a href="/register.html" className="text-primary hover:underline font-medium">
              Register
            </a>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              <strong>🔐 Admin Access:</strong><br/>
              Only jayakodyarachchigemahisha@gmail.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
