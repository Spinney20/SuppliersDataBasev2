import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Agency from "./pages/Agency";

const qc = new QueryClient();

// Check if we're running in Electron
const isElectron = window.electronAPI !== undefined;

export default function App() {
  const [isElectronReady, setIsElectronReady] = useState(!isElectron);

  useEffect(() => {
    // If we're in Electron, check that the API is ready
    if (isElectron) {
      // This could be expanded to check if the Python backend is running
      window.electronAPI.getDbConfig()
        .then(() => {
          setIsElectronReady(true);
        })
        .catch(err => {
          console.error("Failed to get database config:", err);
          setIsElectronReady(false);
        });
    }
  }, []);

  // Show loading if Electron is not ready
  if (!isElectronReady) {
    return <div>Loading application...</div>;
  }

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/agency/:id" element={<Agency />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
