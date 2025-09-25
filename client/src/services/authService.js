import API_URL from './api';

async function parseJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function handleResponse(response, defaultMessage) {
  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || defaultMessage;
    const error = new Error(message);
    if (data?.field) {
      error.field = data.field;
    }
    error.details = data;
    throw error;
  }

  return data;
}

export async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse(response, 'Failed to log in.');
}

export async function register({ fullName, email, password, confirmPassword, role }) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fullName, email, password, confirmPassword, role }),
  });

  return handleResponse(response, 'Failed to register.');
}
