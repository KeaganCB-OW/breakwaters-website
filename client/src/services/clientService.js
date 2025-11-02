import API_URL from './api';

const buildAuthHeaders = (token) => {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

async function parseJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function buildError(message, data) {
  const error = new Error(message);
  if (data) {
    error.details = data;
  }
  return error;
}

export async function createClient(payload, token) {
  const response = await fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || 'Failed to submit client information';
    throw buildError(message, data);
  }

  return data;
}

export async function fetchCurrentClient(token) {
  const response = await fetch(`${API_URL}/clients/me`, {
    headers: {
      ...buildAuthHeaders(token),
      'Content-Type': 'application/json',
    },
  });

  const data = await parseJson(response);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const message = data?.message || 'Failed to load client submission';
    throw buildError(message, data);
  }

  return data;
}

export async function fetchClients() {
  const response = await fetch(`${API_URL}/clients`);

  if (!response.ok) {
    throw new Error('Failed to load clients');
  }

  return response.json();
}

export async function updateClient(clientId, payload, token) {
  const response = await fetch(`${API_URL}/clients/${clientId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || 'Failed to update client';
    throw buildError(message, data);
  }

  return data;
}

export async function deleteClient(clientId, token) {
  const response = await fetch(`${API_URL}/clients/${clientId}`, {
    method: 'DELETE',
    headers: {
      ...buildAuthHeaders(token),
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || 'Failed to delete client';
    throw buildError(message, data);
  }

  return data;
}
