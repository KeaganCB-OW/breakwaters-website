import API_URL from './api';

export async function fetchClients() {
  const response = await fetch(`${API_URL}/clients`);

  if (!response.ok) {
    throw new Error('Failed to load clients');
  }

  return response.json();
}
