import API_URL from './api';

const buildAuthHeaders = (token) => {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const parseJsonSafely = (value) => {
  if (value == null || value === '') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

export function uploadClientCv({ clientId, file }, token, onProgress) {
  return new Promise((resolve, reject) => {
    if (!clientId) {
      reject(new Error('A client identifier is required.'));
      return;
    }

    if (!file) {
      reject(new Error('Attach a PDF file before uploading.'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/cv/upload`);

    const headers = buildAuthHeaders(token);
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== 'function') {
        return;
      }

      const progress = event.total > 0 ? event.loaded / event.total : 0;
      onProgress(Math.min(Math.max(progress, 0), 1));
    };

    xhr.onerror = () => {
      reject(new Error('Network error while uploading CV.'));
    };

    xhr.onload = () => {
      const status = xhr.status;
      const responseData =
        typeof xhr.response === 'object' && xhr.response !== null
          ? xhr.response
          : parseJsonSafely(xhr.responseText);

      if (status >= 200 && status < 300) {
        resolve(responseData || { success: true });
        return;
      }

      const message =
        responseData?.message ||
        (status === 413
          ? 'The CV file is too large. The maximum allowed size is 5MB.'
          : 'Failed to upload CV.');

      const error = new Error(message);
      if (responseData) {
        error.details = responseData;
      }

      reject(error);
    };

    const formData = new FormData();
    formData.append('client_id', clientId);
    formData.append('cv', file);

    xhr.send(formData);
  });
}

export async function fetchLatestClientCv(clientId, token) {
  if (!clientId) {
    throw new Error('A client identifier is required.');
  }

  const response = await fetch(`${API_URL}/cv/latest/${clientId}`, {
    headers: {
      ...buildAuthHeaders(token),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || 'Failed to load CV details.';
    const error = new Error(message);
    if (data) {
      error.details = data;
    }
    throw error;
  }

  return data;
}
