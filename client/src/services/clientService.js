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

function buildError(message, data, status) {
  const error = new Error(message);
  if (data) {
    error.details = data;
  }
  if (typeof status === 'number') {
    error.status = status;
  }
  return error;
}

export async function fetchCurrentClient(token) {
  const response = await fetch(`${API_URL}/clients/me`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token),
    },
  });

  if (response.status === 404) {
    return null;
  }

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || 'Failed to load client profile';
    throw buildError(message, data, response.status);
  }

  return data;
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
    const message = data?.message || 'Failed to submit client profile';
    throw buildError(message, data, response.status);
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
