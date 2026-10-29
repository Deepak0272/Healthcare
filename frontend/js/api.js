/**
 * Health Tech API Client Module
 * Handles authentication headers, REST requests, and UI toast alerts
 */

const API_BASE_URL = window.location.origin.includes(':5000') || window.location.origin.includes('localhost')
  ? `${window.location.origin}/api`
  : 'http://localhost:5000/api';

const TOKEN_KEY = 'healthtech_token';
const USER_KEY = 'healthtech_user';

const getToken = () => localStorage.getItem(TOKEN_KEY);

const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && !endpoint.includes('/auth/login')) {
        clearSession();
        window.location.href = 'login.html?expired=1';
      }
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
};

// UI Notification Toast
const showToast = (message, type = 'info') => {
  let toastContainer = document.getElementById('ht-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'ht-toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '24px';
    toastContainer.style.right = '24px';
    toastContainer.style.zIndex = '9999';
    toastContainer.style.display = 'flex';
    toastContainer.style.flexDirection = 'column';
    toastContainer.style.gap = '10px';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColors = {
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#0284c7'
  };

  toast.style.background = bgColors[type] || bgColors.info;
  toast.style.color = '#ffffff';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '10px';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
  toast.style.fontSize = '0.92rem';
  toast.style.fontWeight = '600';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.style.maxWidth = '380px';
  toast.style.animation = 'fadeInRight 0.3s ease';

  const iconName = type === 'success' ? 'check-circle-fill' : type === 'danger' ? 'exclamation-octagon-fill' : 'info-circle-fill';
  toast.innerHTML = `<i class="bi bi-${iconName}"></i> <span>${message}</span>`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Global Emergency SOS trigger handler used across dashboard pages
const triggerGlobalSOS = async (customReason = '') => {
  try {
    const res = await apiRequest('/emergency/alerts', {
      method: 'POST',
      body: JSON.stringify({
        alertType: 'SOS_CRITICAL',
        customMessage: customReason || 'URGENT: Patient pressed Emergency SOS trigger button on dashboard.'
      })
    });

    showToast('Emergency SOS alert processed successfully!', 'danger');
    return res;
  } catch (err) {
    showToast(`SOS Error: ${err.message}`, 'danger');
    throw err;
  }
};
