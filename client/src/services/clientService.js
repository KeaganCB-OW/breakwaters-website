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

export async function fetchClients() {
  const response = await fetch(`${API_URL}/clients`);

  if (!response.ok) {
    throw new Error('Failed to load clients');
  }

  return response.json();
}

const parseErrorResponse = async (response) => {
  const data = await parseJson(response);
  const message = data?.message || 'Unexpected error';
  const error = new Error(message);
  error.status = response.status;
  if (data) {
    error.details = data;
  }
  return error;
};

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

export async function fetchCurrentClientProfile(token) {
  const response = await fetch(`${API_URL}/clients/me`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token),
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

export async function createClientProfile(payload, token) {
  const response = await fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}
