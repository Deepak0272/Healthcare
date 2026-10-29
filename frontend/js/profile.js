/**
 * Health Tech Profile Management Module
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  await loadUserProfile();
  setupProfileForm();
});

const loadUserProfile = async () => {
  try {
    const res = await apiRequest('/auth/me');
    const u = res.user;

    document.getElementById('profName').value = u.name || '';
    document.getElementById('profEmail').value = u.email || '';
    document.getElementById('profAge').value = u.age || '';
    document.getElementById('profGender').value = u.gender || 'Prefer not to say';
    document.getElementById('profPhone').value = u.phone || '';
    document.getElementById('profBloodGroup').value = u.bloodGroup || 'Unknown';
    document.getElementById('profAllergies').value = (u.allergies || []).join(', ');
    document.getElementById('profConditions').value = (u.chronicConditions || []).join(', ');

    if (u.emergencyContactInfo) {
      document.getElementById('profEmergName').value = u.emergencyContactInfo.name || '';
      document.getElementById('profEmergRel').value = u.emergencyContactInfo.relationship || '';
      document.getElementById('profEmergPhone').value = u.emergencyContactInfo.phone || '';
    }

    if (u.address) {
      document.getElementById('profStreet').value = u.address.street || '';
      document.getElementById('profCity').value = u.address.city || '';
      document.getElementById('profState').value = u.address.state || '';
      document.getElementById('profZip').value = u.address.zipCode || '';
    }

    // Update avatar and name display
    const initials = u.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    const avatarEl = document.getElementById('profileAvatarDisplay');
    if (avatarEl) avatarEl.textContent = initials;
    const nameEl = document.getElementById('profileNameDisplay');
    if (nameEl) nameEl.textContent = u.name;
    const roleEl = document.getElementById('profileRoleDisplay');
    if (roleEl) roleEl.textContent = u.role.toUpperCase();
  } catch (err) {
    showToast(`Failed to load profile: ${err.message}`, 'danger');
  }
};

const setupProfileForm = () => {
  const form = document.getElementById('userProfileForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveProfile');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving Changes...';

    const allergiesRaw = document.getElementById('profAllergies').value;
    const conditionsRaw = document.getElementById('profConditions').value;

    const payload = {
      name: document.getElementById('profName').value,
      age: document.getElementById('profAge').value ? Number(document.getElementById('profAge').value) : undefined,
      gender: document.getElementById('profGender').value,
      phone: document.getElementById('profPhone').value,
      bloodGroup: document.getElementById('profBloodGroup').value,
      allergies: allergiesRaw ? allergiesRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
      chronicConditions: conditionsRaw ? conditionsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
      emergencyContactInfo: {
        name: document.getElementById('profEmergName').value,
        relationship: document.getElementById('profEmergRel').value,
        phone: document.getElementById('profEmergPhone').value
      },
      address: {
        street: document.getElementById('profStreet').value,
        city: document.getElementById('profCity').value,
        state: document.getElementById('profState').value,
        zipCode: document.getElementById('profZip').value
      }
    };

    try {
      const res = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      // Update local storage user record
      localStorage.setItem('healthtech_user', JSON.stringify(res.user));

      showToast('Profile updated successfully!', 'success');
      await loadUserProfile();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-save me-1"></i>Save Profile Changes';
    }
  });
};
