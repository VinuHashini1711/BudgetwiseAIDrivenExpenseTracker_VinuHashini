import axios from 'axios';

// Axios instance with JWT interceptor
// Note: baseURL is empty since we use full paths like /api/transactions
const instance = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' }
});

// Add JWT token to all requests
instance.interceptors.request.use(
  (config) => {
    // Try both token and bw_token keys
    const token = localStorage.getItem('token') || localStorage.getItem('bw_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("JWT Token added to request:", token.substring(0, 20) + "...");
    } else {
      console.warn("No JWT token found in localStorage");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Log responses for debugging
instance.interceptors.response.use(
  (response) => {
    console.log("Response received:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("Response error:", error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default instance;
