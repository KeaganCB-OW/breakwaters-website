import API_URL from './api';

export async function fetchAssignments() {
  const response = await fetch(`${API_URL}/assignments`);

  if (!response.ok) {
    throw new Error('Failed to load assignments');
  }

  return response.json();
}
