import API_URL from './api';

export async function fetchClients() {
  const response = await fetch(`${API_URL}/clients`);

  if (!response.ok) {
    throw new Error('Failed to load clients');
  }

  return response.json();
}

export async function updateClient(clientId, payload) {
  const response = await fetch(`${API_URL}/clients/${clientId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    // ignore non-JSON responses
  }

  if (!response.ok) {
    const message = data?.message || 'Failed to update client';
    const error = new Error(message);
    if (data) {
      error.details = data;
    }
    throw error;
  }

  return data;
}
