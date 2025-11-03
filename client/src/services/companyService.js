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

export async function fetchCompanyStats(token) {
  const response = await fetch(`${API_URL}/companies/stats`, {
    headers: {
      ...buildAuthHeaders(token),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load company stats');
  }

  return response.json();
}

export async function fetchCompanies(token) {
  const response = await fetch(`${API_URL}/companies`, {
    headers: {
      ...buildAuthHeaders(token),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load companies');
  }

  return response.json();
}

export async function createCompany(payload, token) {
  const response = await fetch(`${API_URL}/companies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || 'Failed to submit company information';
    throw buildError(message, data);
  }

  return data;
}
