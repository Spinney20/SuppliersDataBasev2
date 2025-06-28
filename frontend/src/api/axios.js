import axios from "axios";

// Determine if we're running in Electron
const isElectron = window.electronAPI !== undefined;

// Get API URL based on environment
const getApiUrl = () => {
  // In Electron, we'll use a local server
  if (isElectron) {
    return 'http://localhost:8000';
  }
  
  // In development or production web, use the environment variable
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

export const api = axios.create({
  baseURL: getApiUrl(),
});

// For Electron: Update axios config when DB config changes
if (isElectron) {
  window.electronAPI.getDbConfig().then(dbConfig => {
    // You could use this to customize the API URL if needed
    console.log('Using database config:', dbConfig);
  });
}
