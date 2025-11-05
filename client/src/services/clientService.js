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

export async function fetchClients(token, params = {}) {
  const url = new URL(`${API_URL}/clients`);

  if (params.search) {
    url.searchParams.set('search', params.search);
  }

  if (params.status) {
    url.searchParams.set('status', params.status);
  }

  if (params.page) {
    url.searchParams.set('page', String(params.page));
  }

  if (params.pageSize) {
    url.searchParams.set('pageSize', String(params.pageSize));
  }

  if (params.limit) {
    url.searchParams.set('limit', String(params.limit));
  }

  const response = await fetch(url.toString(), {
    headers: {
      ...buildAuthHeaders(token),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load clients');
  }

  return response.json();
}

export async function fetchClientById(clientId, token) {
  if (!clientId) {
    throw new Error('Client identifier is required');
  }

  const response = await fetch(`${API_URL}/clients/${clientId}`, {
    headers: {
      ...buildAuthHeaders(token),
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || 'Failed to load client details';
    throw buildError(message, data);
  }

  return data;
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

export async function updateClientStatus(clientId, status, token) {
  if (!clientId) {
    throw new Error('Client identifier is required');
  }

  const response = await fetch(`${API_URL}/clients/${clientId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({ status }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || 'Failed to update client status';
    throw buildError(message, data);
  }

  return data;
}
