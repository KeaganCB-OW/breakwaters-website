import API_URL from './api';

const buildAuthHeaders = (token) => {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

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
