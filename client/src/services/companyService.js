import API_URL from './api';

export async function fetchCompanyStats() {
  const response = await fetch(`${API_URL}/companies/stats`);

  if (!response.ok) {
    throw new Error('Failed to load company stats');
  }

  return response.json();
}

export async function fetchCompanies() {
  const response = await fetch(`${API_URL}/companies`);

  if (!response.ok) {
    throw new Error('Failed to load companies');
  }

  return response.json();
}

