// API configuration and utility for frontend-backend communication
const API_BASE = 'http://localhost:5000';

export const apiFetch = async (endpoint, options = {}) => {
  const { method = 'GET', body, token } = options;
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    return response;
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
};

export const API_BASE_URL = API_BASE;
