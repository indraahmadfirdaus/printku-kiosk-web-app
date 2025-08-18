import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import PrintCodeInput from './pages/PrintCodeInput';
import ScreenSaver from './pages/ScreenSaver';
import KioskSetupModal from './components/KioskSetupModal';
import { useKiosk } from './hooks/useKiosk';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const { isSetupRequired } = useKiosk();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<PrintCodeInput />} />
            <Route path="/screensaver" element={<ScreenSaver />} />
          </Routes>
          
          <KioskSetupModal 
            isOpen={isSetupRequired}
            onClose={() => {}}
            theme="blackboxz"
          />
          
          {/* Toast Container */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                  color: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
