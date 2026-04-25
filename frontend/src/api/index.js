const BASE = '/api';
export const BACKEND_URL = import.meta.env.BACKEND_URL || '';

function headers(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function register(username, email, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse(res);
}

export async function login(email, password) {
  // email can actually be username or email based on backend logic
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function fetchTrees() {
  const res = await fetch(`${BASE}/trees`);
  return handleResponse(res);
}

export async function fetchTree(treeId, token) {
  const res = await fetch(`${BASE}/trees/${treeId}`, {
    headers: headers(token),
  });
  return handleResponse(res);
}

export async function markObtained(treeId, certId, token) {
  const res = await fetch(`${BASE}/trees/${treeId}/certifications/${certId}`, {
    method: 'POST',
    headers: headers(token),
  });
  return handleResponse(res);
}

export async function markNotObtained(treeId, certId, token) {
  const res = await fetch(`${BASE}/trees/${treeId}/certifications/${certId}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  return handleResponse(res);
}

export async function fetchUserProfile(token) {
  const res = await fetch(`${BASE}/user/profile`, {
    headers: headers(token),
  });
  return handleResponse(res);
}

export async function checkAvailability(type, value, token) {
  const res = await fetch(`${BASE}/user/check-availability?type=${type}&value=${encodeURIComponent(value)}`, {
    method: 'GET',
    headers: headers(token),
  });
  return handleResponse(res);
}

export async function updateUserProfile(body, token) {
  const res = await fetch(`${BASE}/user/profile`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function uploadProfilePicture(formData, token) {
  // Manual header
  const h = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  // Fetch will automatically set it to multipart/form-data with the correct boundary
  const res = await fetch(`${BASE}/user/profile-picture`, {
    method: 'POST',
    headers: h,
    body: formData,
  });
  return handleResponse(res);
}

export async function removeProfilePicture(token) {
  const res = await fetch(`${BASE}/user/profile-picture`, {
    method: 'DELETE',
    headers: headers(token),
  });
  return handleResponse(res);
}
