import axios from "axios";

// Determine if we're running in Electron
const isElectron = window.api !== undefined;

// Cache pentru a evita recalcularea URL-ului API la fiecare cerere
const API_URL = (() => {
  // În Electron, folosim un server local
  if (isElectron) {
    return 'http://localhost:8000';
  }
  
  // În dezvoltare sau producție web, folosim variabila de mediu
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
})();

// Creăm o instanță axios optimizată
export const api = axios.create({
  baseURL: API_URL,
  // Optimizări pentru performanță
  timeout: 10000, // 10 secunde timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Evităm transformarea inutilă a datelor pentru cereri simple
  transformRequest: [(data) => {
    return data === undefined ? data : JSON.stringify(data);
  }],
});

// Adăugăm interceptori pentru a gestiona erorile și a îmbunătăți performanța
api.interceptors.request.use(
  (config) => {
    // Adăugăm un timestamp pentru a evita cache-ul browserului
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor pentru răspunsuri pentru a gestiona erorile comune
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Logăm erorile pentru debugging
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Pentru Electron: Actualizăm configurația axios când se schimbă configurația DB
if (isElectron) {
  window.api.getDbConfig().then(dbConfig => {
    console.log('Using database config:', dbConfig);
  }).catch(err => {
    console.warn('Failed to get DB config:', err);
  });
}
