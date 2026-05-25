import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(err);
    }
    if (err.code === 'ECONNABORTED' || err.code === 'ERR_CANCELED') {
      err.userMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
      return Promise.reject(err);
    }
    if (err.code === 'ERR_NETWORK' || !err.response) {
      err.userMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
      return Promise.reject(err);
    }
    return Promise.reject(err);
  }
);

export default client;
