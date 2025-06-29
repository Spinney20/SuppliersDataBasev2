import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { UserProvider } from "./context/UserContext";
import UserStatus from "./components/UserStatus";
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import './App.css';

// Lazy loading pentru paginile principale
const Home = lazy(() => import("./pages/Home"));
const Agency = lazy(() => import("./pages/Agency"));

// Loading component pentru Suspense
const LoadingFallback = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#121212'
    }}
  >
    <CircularProgress color="primary" />
  </Box>
);

// Create a client cu optimizări pentru performanță
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minute
      cacheTime: 10 * 60 * 1000, // 10 minute
    },
  },
});

// Check if we're running in Electron
const isElectron = window.api !== undefined;

export default function App() {
  const [isElectronReady, setIsElectronReady] = useState(!isElectron);

  // Creăm tema o singură dată folosind useMemo pentru a evita recalculările
  const theme = useMemo(() => {
    // Creăm tema de bază
    const baseTheme = createTheme({
      palette: {
        primary: {
          main: '#1976d2',
          light: '#42a5f5',
          dark: '#1565c0',
        },
        secondary: {
          main: '#dc004e',
          light: '#ff4081',
          dark: '#c51162',
        },
        background: {
          default: '#f5f5f5',
          paper: '#ffffff',
        },
        // Optimizăm pentru performanță reducând numărul de culori
        text: {
          primary: 'rgba(0, 0, 0, 0.87)',
          secondary: 'rgba(0, 0, 0, 0.6)',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        // Optimizăm pentru performanță definind doar stilurile necesare
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
        // Optimizăm pentru performanță definind doar override-urile necesare
        MuiButton: {
          defaultProps: {
            disableRipple: true, // Dezactivăm ripple pentru performanță
          },
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
        // Optimizăm Dialog-urile
        MuiDialog: {
          defaultProps: {
            transitionDuration: 150, // Reducem durata animațiilor
          },
        },
        // Optimizăm tranzițiile
        MuiCssBaseline: {
          styleOverrides: {
            '*, *::before, *::after': {
              transition: 'none !important', // Dezactivăm tranzițiile implicite
            },
          },
        },
      },
    });
    
    // Aplicăm responsive font sizes pentru a optimiza textul pe diferite dispozitive
    return responsiveFontSizes(baseTheme);
  }, []); // Dependențe goale - tema se creează o singură dată

  useEffect(() => {
    // If we're in Electron, check that the API is ready
    if (isElectron) {
      // Adăugăm un timeout pentru a evita blocarea UI
      const timeoutId = setTimeout(() => {
        setIsElectronReady(true); // Forțăm încărcarea după timeout
      }, 3000); // 3 secunde timeout maxim
      
      // Încercăm să obținem configurația
      window.api.getDbConfig()
        .then(() => {
          clearTimeout(timeoutId);
          setIsElectronReady(true);
        })
        .catch(err => {
          console.error("Failed to get database config:", err);
          // Nu setăm isElectronReady la false, lăsăm timeout-ul să se ocupe
        });
        
      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Show loading if Electron is not ready
  if (!isElectronReady) {
    return <LoadingFallback />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/agency/:id" element={<Agency />} />
              </Routes>
            </Suspense>
            <UserStatus />
          </BrowserRouter>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
