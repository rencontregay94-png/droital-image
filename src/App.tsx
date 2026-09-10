import React, { useState, useEffect } from 'react';
import { ParentFormView } from './components/ParentFormView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { BrandingProvider } from './context/BrandingContext';
import { BrandingUploadModal } from './components/BrandingUploadModal';
import { AdminUser } from './types';

export default function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState<string>('');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<'parent' | 'admin'>('parent');

  // Check URL on load (e.g. /admin)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin') || window.location.hash === '#admin') {
      setCurrentRoute('admin');
    }

    // Check stored token
    const token = localStorage.getItem('ndm_admin_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setIsAdminLoggedIn(true);
            setAdminUser(data.user);
            setAdminToken(token);
          } else {
            localStorage.removeItem('ndm_admin_token');
          }
        })
        .catch(() => {
          localStorage.removeItem('ndm_admin_token');
        });
    }

    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('parent');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLoginSuccess = (user: AdminUser, token: string) => {
    setIsAdminLoggedIn(true);
    setAdminUser(user);
    setAdminToken(token);
    setCurrentRoute('admin');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('ndm_admin_token');
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    setAdminToken('');
    setCurrentRoute('parent');
    window.history.pushState({}, '', '/');
  };

  const openAdminLogin = () => {
    if (isAdminLoggedIn && adminUser) {
      setCurrentRoute('admin');
    } else {
      setLoginModalOpen(true);
    }
  };

  return (
    <BrandingProvider>
      <div className="min-h-screen">
        {currentRoute === 'admin' && isAdminLoggedIn && adminUser ? (
          <AdminDashboardView
            user={adminUser}
            token={adminToken}
            onLogout={handleLogout}
          />
        ) : (
          <ParentFormView onOpenAdminLogin={openAdminLogin} />
        )}

        {/* Admin Login Modal */}
        <AdminLoginModal
          isOpen={loginModalOpen || (currentRoute === 'admin' && !isAdminLoggedIn)}
          onClose={() => {
            setLoginModalOpen(false);
            if (currentRoute === 'admin' && !isAdminLoggedIn) {
              setCurrentRoute('parent');
              window.history.pushState({}, '', '/');
            }
          }}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* Branding Upload Modal for custom Logo & Signature */}
        <BrandingUploadModal />
      </div>
    </BrandingProvider>
  );
}
