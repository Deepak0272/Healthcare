/**
 * Health Tech Authentication & Session Guard Module
 */

const requireAuth = () => {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
    return null;
  }
  return getUser();
};

const redirectIfAuth = () => {
  const token = getToken();
  if (token) {
    window.location.href = 'dashboard.html';
  }
};

const logout = () => {
  clearSession();
  window.location.href = 'login.html';
};

const setupUserInterface = () => {
  const user = getUser();
  if (!user) return;

  // Populate names, avatars and role badges across dashboard layout
  const nameEls = document.querySelectorAll('.user-display-name');
  nameEls.forEach((el) => (el.textContent = user.name || 'Patient'));

  const roleEls = document.querySelectorAll('.user-display-role');
  roleEls.forEach((el) => {
    el.textContent = user.role ? user.role.toUpperCase() : 'PATIENT';
  });

  const avatarEls = document.querySelectorAll('.user-avatar-initials');
  avatarEls.forEach((el) => {
    const initials = user.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'U';
    el.textContent = initials;
  });

  // If user is Admin, ensure Admin Panel link is visible in sidebar
  if (user.role === 'admin') {
    const adminMenuEl = document.getElementById('sidebar-admin-link');
    if (adminMenuEl) {
      adminMenuEl.style.display = 'block';
    }
  }
};

// Sidebar mobile toggle helper
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.querySelector('.sidebar-toggle-btn');
  const sidebar = document.querySelector('.dashboard-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });
  }

  // Bind logout buttons
  const logoutBtns = document.querySelectorAll('.btn-logout-action');
  logoutBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });

  setupUserInterface();
});
