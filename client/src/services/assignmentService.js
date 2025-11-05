import API_URL from './api';

const buildAuthHeaders = (token) => {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function fetchAssignments(token, params = {}) {
  const url = new URL(`${API_URL}/assignments`);

  if (params.limit) {
    url.searchParams.set('limit', String(params.limit));
  }

  const response = await fetch(url.toString(), {
    headers: {
      ...buildAuthHeaders(token),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load assignments');
  }

  return response.json();
}

export async function suggestAssignment(clientId, companyId, token) {
  const response = await fetch(`${API_URL}/assignments/suggest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify({ clientId, companyId }),
  });

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    // ignore JSON parse errors for empty responses
  }

  if (!response.ok) {
    const message = data?.message || 'Failed to suggest assignment';
    const error = new Error(message);
    if (data) {
      error.details = data;
    }
    throw error;
  }

  return data;
}
