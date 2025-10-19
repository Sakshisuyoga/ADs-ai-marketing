import { writable } from 'svelte/store'

export const auth = writable({ token: null, email: null, name: null })

export function loadAuthFromStorage() {
  const token = localStorage.getItem('access_token')
  const email = localStorage.getItem('user_email')
  const name = localStorage.getItem('user_name')
  auth.set({ token, email, name })
}

export async function signInDemo(email) {
  try {
    const response = await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error('Demo login failed');
    }

    const data = await response.json();
    const token = data.token;
    const name = `${data.user.first_name} ${data.user.last_name}`;

    localStorage.setItem('access_token', token);
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_name', name);
    auth.set({ token, email, name });

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Demo login error:', error);
    return { success: false, error: error.message };
  }
}

export function signOut() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_email')
  localStorage.removeItem('user_name')
  auth.set({ token: null, email: null, name: null })
}

// Helper function to make authenticated API calls
export function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}


