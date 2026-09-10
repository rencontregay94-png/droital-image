import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface BrandingContextType {
  logoUrl: string | null;
  signatureUrl: string | null;
  isLoading: boolean;
  updateLogo: (dataUrl: string | null) => Promise<void>;
  updateSignature: (dataUrl: string | null) => Promise<void>;
  resetBranding: (target?: 'logo' | 'signature' | 'all') => Promise<void>;
  isUploadModalOpen: boolean;
  activeUploadTab: 'logo' | 'signature';
  openUploadModal: (initialTab?: 'logo' | 'signature') => void;
  closeUploadModal: () => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    return localStorage.getItem('ndm_custom_logo') || null;
  });
  const [signatureUrl, setSignatureUrl] = useState<string | null>(() => {
    return localStorage.getItem('ndm_custom_signature') || null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeUploadTab, setActiveUploadTab] = useState<'logo' | 'signature'>('logo');

  // Load from backend on start
  useEffect(() => {
    let isMounted = true;
    fetch('/api/branding')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          localStorage.setItem('ndm_custom_logo', data.logoUrl);
        }
        if (data.signatureUrl) {
          setSignatureUrl(data.signatureUrl);
          localStorage.setItem('ndm_custom_signature', data.signatureUrl);
        }
      })
      .catch((err) => {
        console.warn('Could not load branding from server, using local storage:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const updateLogo = useCallback(async (dataUrl: string | null) => {
    setLogoUrl(dataUrl);
    if (dataUrl) {
      localStorage.setItem('ndm_custom_logo', dataUrl);
    } else {
      localStorage.removeItem('ndm_custom_logo');
    }

    try {
      await fetch('/api/branding', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ logoUrl: dataUrl }),
      });
    } catch (e) {
      console.error('Error saving logo to server:', e);
    }
  }, []);

  const updateSignature = useCallback(async (dataUrl: string | null) => {
    setSignatureUrl(dataUrl);
    if (dataUrl) {
      localStorage.setItem('ndm_custom_signature', dataUrl);
    } else {
      localStorage.removeItem('ndm_custom_signature');
    }

    try {
      await fetch('/api/branding', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ signatureUrl: dataUrl }),
      });
    } catch (e) {
      console.error('Error saving signature to server:', e);
    }
  }, []);

  const resetBranding = useCallback(async (target: 'logo' | 'signature' | 'all' = 'all') => {
    if (target === 'logo' || target === 'all') {
      setLogoUrl(null);
      localStorage.removeItem('ndm_custom_logo');
    }
    if (target === 'signature' || target === 'all') {
      setSignatureUrl(null);
      localStorage.removeItem('ndm_custom_signature');
    }

    try {
      await fetch('/api/branding/reset', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ target }),
      });
    } catch (e) {
      console.error('Error resetting branding on server:', e);
    }
  }, []);

  const openUploadModal = useCallback((initialTab: 'logo' | 'signature' = 'logo') => {
    setActiveUploadTab(initialTab);
    setIsUploadModalOpen(true);
  }, []);

  const closeUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  return (
    <BrandingContext.Provider
      value={{
        logoUrl,
        signatureUrl,
        isLoading,
        updateLogo,
        updateSignature,
        resetBranding,
        isUploadModalOpen,
        activeUploadTab,
        openUploadModal,
        closeUploadModal,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    return {
      logoUrl: null,
      signatureUrl: null,
      isLoading: false,
      updateLogo: async () => {},
      updateSignature: async () => {},
      resetBranding: async () => {},
      isUploadModalOpen: false,
      activeUploadTab: 'logo',
      openUploadModal: () => {},
      closeUploadModal: () => {},
    };
  }
  return context;
};
