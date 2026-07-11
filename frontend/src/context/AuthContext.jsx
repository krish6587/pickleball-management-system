import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUser({ ...data, token });
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to authenticate token', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  // Session management: 30 minutes inactive logout
  useEffect(() => {
    let timeoutId;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (user) {
        timeoutId = setTimeout(() => {
          console.log('Session expired due to 30 mins inactivity');
          logout();
        }, 30 * 60 * 1000); // 30 minutes
      }
    };

    if (user) {
      resetTimer();
      const events = ['mousedown', 'keydown', 'scroll', 'click', 'touchstart'];
      events.forEach((event) => window.addEventListener(event, resetTimer));

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        events.forEach((event) => window.removeEventListener(event, resetTimer));
      };
    }
  }, [user]);

  // Step 1: Send OTP to Email
  const sendOtpEmail = async (email) => {
    const res = await fetch(`${API_URL}/auth/send-otp-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
    return data;
  };

  // Step 2: Verify Email OTP
  const verifyOtpEmail = async (email, otpCode) => {
    const res = await fetch(`${API_URL}/auth/verify-otp-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'OTP verification failed');
    return data;
  };

  // Step 3: Complete registration details
  const completeProfile = async (profileData) => {
    const res = await fetch(`${API_URL}/auth/complete-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Profile completion failed');
    
    // Auto-login upon completion
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data);
    return data;
  };

  // Unified Login (supports OTP login & normal login with admin 2FA checking)
  const login = async (credentials) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    // Return if extra OTP verify is needed (for passwordless OTP login or Admin 2FA)
    if (data.requiresOtpVerify || data.requires2fa) {
      return data;
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data);
    return data;
  };

  // Verify Login OTP
  const verifyLoginOtp = async (email, otpCode) => {
    const res = await fetch(`${API_URL}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login OTP verification failed');

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data);
    return data;
  };

  // Verify Admin 2FA
  const verify2faAdmin = async (email, otpCode) => {
    const res = await fetch(`${API_URL}/auth/verify-2fa-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '2FA Verification failed');

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data);
    return data;
  };

  // Forgot Password Request
  const forgotPasswordRequest = async (email) => {
    const res = await fetch(`${API_URL}/auth/forgot-password-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  };

  // Forgot Password Reset
  const forgotPasswordReset = async (email, otpCode, newPassword) => {
    const res = await fetch(`${API_URL}/auth/forgot-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Reset password failed');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };



  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sendOtpEmail,
        verifyOtpEmail,
        verifyOtp: verifyOtpEmail,
        completeProfile,
        login,
        verifyLoginOtp,
        verify2faAdmin,
        forgotPasswordRequest,
        forgotPasswordReset,
        logout,
        API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
