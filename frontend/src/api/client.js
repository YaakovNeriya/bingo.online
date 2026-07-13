import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const impersonatedUserId = localStorage.getItem('impersonatedUserId');
  if (impersonatedUserId) {
    config.headers['X-Impersonate-User'] = impersonatedUserId;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the token expires or the user is unauthorized during an action
    if (error.response && error.response.status === 401) {
      const url = error.config.url;
      // We don't want to redirect if they just opened the app (initial checkAuth)
      // or if they are actively trying to login
      if (!url.includes('/users/me') && !url.includes('/users/login') && !url.includes('/users/auth/google')) {
        window.location.href = `/login?session_expired=true&returnUrl=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default client;
