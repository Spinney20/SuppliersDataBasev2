import axios from "axios";

// Determine if we're running in Electron
const isElectron = window.api !== undefined;

// Funcție pentru a obține URL-ul API bazat pe configurația bazei de date
const getApiUrl = () => {
  // În Electron, folosim un server local
  if (isElectron) {
    return 'http://localhost:8000';
  }
  
  // În versiunea web, verificăm dacă există o configurație în localStorage
  try {
    const savedConfig = localStorage.getItem('dbConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      // Verificăm dacă URL-ul API este configurat în localStorage
      if (config.apiUrl) {
        console.log('Using API URL from localStorage:', config.apiUrl);
        return config.apiUrl;
      }
    }
  } catch (error) {
    console.error('Error reading API URL from localStorage:', error);
  }
  
  // Folosim variabila de mediu sau valoarea implicită
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

// Creăm o instanță axios optimizată
export const api = axios.create({
  baseURL: getApiUrl(),
  // Optimizări pentru performanță
  timeout: 30000, // 30 secunde timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Adăugăm interceptori pentru a gestiona erorile și a îmbunătăți performanța
api.interceptors.request.use(
  (config) => {
    // If FormData is being sent, let the browser set the Content-Type with boundary
    if (config.data instanceof FormData) {
      // Important: delete the Content-Type header to let the browser set it with the correct boundary
      delete config.headers['Content-Type'];
      
      console.log('FormData detected, removed Content-Type header');
    }
    
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

// Funcție pentru a actualiza URL-ul API
export const updateApiUrl = (newUrl) => {
  api.defaults.baseURL = newUrl;
  console.log('API URL updated to:', newUrl);
};

// Ascultăm pentru modificări în localStorage (pentru versiunea web)
if (!isElectron) {
  window.addEventListener('storage', (event) => {
    if (event.key === 'dbConfig') {
      try {
        const newConfig = JSON.parse(event.newValue);
        if (newConfig && newConfig.apiUrl) {
          updateApiUrl(newConfig.apiUrl);
        }
      } catch (error) {
        console.error('Error processing localStorage change:', error);
      }
    }
  });
}
