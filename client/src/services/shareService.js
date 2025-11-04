import API_URL from './api';

const buildShareEndpoint = (clientId, token) => {
  const base = String(API_URL || '').replace(/\/+$/, '');
  const path = `${base}/share/clients/${clientId}`;

  if (!token) {
    return path;
  }

  const params = new URLSearchParams();
  params.set('token', token);
  return `${path}?${params.toString()}`;
};

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

export async function fetchSharedClient(clientId, token) {
  if (!clientId) {
    throw new Error('A client identifier is required.');
  }

  if (!token) {
    throw new Error('This link requires a token.');
  }

  const endpoint = buildShareEndpoint(clientId, token);

  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    const message =
      data?.message ||
      (response.status === 401
        ? 'This link has expired or is invalid.'
        : 'Failed to load client details.');
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

