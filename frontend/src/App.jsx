import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Agency from "./pages/Agency";
import { UserProvider } from "./context/UserContext";
import UserStatus from "./components/UserStatus";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Check if we're running in Electron
const isElectron = window.api !== undefined;

export default function App() {
  const [isElectronReady, setIsElectronReady] = useState(!isElectron);

  useEffect(() => {
    // If we're in Electron, check that the API is ready
    if (isElectron) {
      // This could be expanded to check if the Python backend is running
      window.api.getDbConfig()
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/agency/:id" element={<Agency />} />
            </Routes>
            <UserStatus />
          </BrowserRouter>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
