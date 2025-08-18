import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ArrowRight, AlertTriangle, Box } from 'lucide-react';
import VirtualKeyboard from '../components/VirtualKeyboard';
import InputDisplay from '../components/InputDisplay';
import KioskDisplay from '../components/KioskDisplay';
import { useActiveAds, useBatchTrackAdViews, useCleanupInactiveAdViews } from '../hooks/useAds';
import useAdsStore from '../stores/adsStore';
import { useKiosk } from '../hooks/useKiosk';
import { usePrint } from '../hooks/usePrint';
import PrintConfirmationModal from '../components/PrintConfirmationModal';

function PrintCodeInput() {
  const navigate = useNavigate();
  const [printCode, setPrintCode] = useState('');
  const idleTimerRef = useRef(null);
  const IDLE_TIME = 100000;
  
  // Kiosk data dari Zustand store
  const { kioskCode, kioskData, getPrinters, getKioskInfo, refreshKioskData } = useKiosk();
  
  // API hooks - consolidated single declaration
  const { data: adsData, isLoading: adsLoading, error: adsError, isSuccess } = useActiveAds();
  const batchTrackMutation = useBatchTrackAdViews();
  const cleanupMutation = useCleanupInactiveAdViews();
  const { getPendingViewCounts, ads, incrementViewCount } = useAdsStore();
  
  // Debug logging
  useEffect(() => {
    console.log('Ads API Status:', { 
      isLoading: adsLoading, 
      isSuccess, 
      error: adsError, 
      data: adsData,
      storeAds: ads 
    });
  }, [adsLoading, isSuccess, adsError, adsData, ads]);
  
  // Gunakan data printer dari kiosk data saja, tanpa fallback ke mock data
  const kioskPrinters = getPrinters();
  const printers = kioskPrinters.map(printer => ({
    id: printer.id,
    name: printer.name || `Printer ${printer.id}`,
    paperCount: printer.paper_count || 0,
    status: printer.is_online ? "online" : "offline"
  }));

  // Reset idle timer
  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    idleTimerRef.current = setTimeout(() => {
      navigate('/screensaver');
    }, IDLE_TIME);
  };

  // Handle user activity
  const handleUserActivity = () => {
    resetIdleTimer();
  };

  // Setup idle timer dan event listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Set initial timer
    resetIdleTimer();
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      // Cleanup
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, []);

  const handleKeyPress = (key) => {
    handleUserActivity(); // Reset timer on interaction
    
    if (key === 'DELETE') {
      setPrintCode(prev => prev.slice(0, -1));
    } else if (key === 'CLEAR') {
      setPrintCode('');
    } else {
      // Hapus pembatasan 6 karakter
      const finalKey = key.toUpperCase();
      setPrintCode(prev => prev + finalKey);
    }
  };

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printJobData, setPrintJobData] = useState(null);
  const { validatePrintCode } = usePrint();

  const handleSubmit = async () => {
    handleUserActivity(); // Reset timer on interaction
    
    if (printCode.length >= 4) {
      try {
        console.log('Validating print code:', printCode);
        const jobData = await validatePrintCode(printCode);
        
        // Tampilkan modal konfirmasi dengan data print job
        setPrintJobData(jobData);
        setShowPrintModal(true);
      } catch (error) {
        // Error sudah di-handle di hook dengan toast
        console.error('Print code validation failed:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowPrintModal(false);
    setPrintJobData(null);
    setPrintCode(''); // Reset print code setelah selesai
  };

  const getPaperStatus = (count) => {
    if (count === 0) return { color: 'text-red-600', bg: 'bg-red-50', status: 'Habis' };
    if (count < 50) return { color: 'text-orange-600', bg: 'bg-orange-50', status: 'Sedikit' };
    return { color: 'text-green-600', bg: 'bg-green-50', status: 'Tersedia' };
  };
  
  // Track view counts when component mounts (returning from screensaver)
  // Updated to use batch tracking with better logging
  useEffect(() => {
    // Cleanup inactive ads first
    cleanupMutation.mutate(null, {
      onSuccess: (inactiveAdIds) => {
        console.log('Cleaned up inactive ads:', inactiveAdIds);

        // Then send remaining valid view counts
        const pendingViews = getPendingViewCounts();
        if (pendingViews.length > 0) {
          console.log('Sending batch view counts:', pendingViews);
          
          batchTrackMutation.mutate(pendingViews, {
            onSuccess: (results) => {
              console.log('Batch tracking success:', results);
              console.log('View counts after clearing:', useAdsStore.getState().viewCounts);
            },
            onError: (error) => {
              console.error('Batch tracking failed:', error);
              console.log('View counts preserved:', useAdsStore.getState().viewCounts);
            }
          });
        } else {
          console.log('No pending view counts to send');
        }
      }
    });
  }, []); // Empty dependency array - only run once on mount

  // Auto-refetch kiosk data ketika komponen dimount dan ada kioskCode
  useEffect(() => {
    if (kioskCode) {
      console.log('Auto-refreshing kiosk data for code:', kioskCode);
      refreshKioskData();
    }
  }, []); // Empty dependency array - hanya run sekali saat mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col min-w-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-blackboxz-dark to-blackboxz-gray py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Box className="w-6 h-6 text-blackboxz-primary" />
              <div className="flex flex-col items-start ml-2">
                <span className="text-white font-bold tracking-wide">BlackBoxZ</span>
                <span className="text-xs text-blackboxz-accent tracking-widest uppercase">KIOSK PRINTING SYSTEM</span>
              </div>
            </div>
            
            {/* Tampilkan info kiosk di header jika ada */}
            {kioskData && (
              <div className="text-right">
                <div className="text-white font-semibold">{kioskData.name}</div>
                <div className="text-blackboxz-accent text-sm">{kioskData.location}</div>
                <div className="text-xs text-blackboxz-accent">Kode: {kioskCode}</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex px-4 py-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto w-full flex gap-6">
          
          {/* Left Section - 2/3 width - Print Code Input */}
          <div className="flex-1 w-2/3 flex items-center justify-center">
            <div className="max-w-2xl mx-auto text-center w-full">
              {/* Title */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-blackboxz-dark mb-3">
                  Cetak Dokumen atau Photo Anda
                </h1>
                <p className="text-lg text-gray-600">
                  Masukkan kode print yang Anda terima untuk melanjutkan
                </p>
              </div>

              {/* Input Display Component */}
              <InputDisplay 
                value={printCode}
                placeholder="Masukkan kode print"
                maxLength={20}
                theme="blackboxz"
                className="mb-6"
              />

              {/* Virtual Keyboard Component */}
              <VirtualKeyboard 
                onKeyPress={handleKeyPress}
                theme="blackboxz"
                keySize="h-12 w-12"
                className="mb-6"
              />

              {/* Submit Button */}
              <div className="space-y-4">
                <button
                  onClick={handleSubmit}
                  disabled={printCode.length < 1} // Ubah dari 4 menjadi 1 atau hapus validasi
                  className={`
                    w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg
                    ${printCode.length >= 1 // Ubah dari 4 menjadi 1
                      ? 'bg-blackboxz-primary text-white hover:bg-blackboxz-secondary transform hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  Lanjutkan
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <p className="text-sm text-gray-500">
                  Masukkan kode print untuk melanjutkan
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - 1/3 width - Kiosk Info & Printer Status */}
          <div className="w-1/3 flex flex-col items-start pt-8 space-y-4">
            {/* Kiosk Display - Updated dengan kioskData */}
            <KioskDisplay 
              kioskCode={kioskCode}
              kioskData={kioskData}
              isSetupRequired={!kioskCode}
              theme="blackboxz"
              className="w-full"
            />
            
            {/* Printer Status - Menggunakan data dari Zustand */}
            <div className="w-full">
              <div className="bg-white rounded-xl p-6 sticky top-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-bold text-blackboxz-dark mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blackboxz-primary rounded flex items-center justify-center">
                    <Printer className="w-4 h-4 text-white" />
                  </div>
                  Status Printer
                </h2>
                
                <div className="space-y-4">
                  {printers.map((printer) => {
                    const paperStatus = getPaperStatus(printer.paperCount);
                    
                    return (
                      <div 
                        key={printer.id}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          printer.status === 'offline' 
                            ? 'border-gray-200 bg-gray-50' 
                            : 'border-blackboxz-primary/20 bg-white hover:border-blackboxz-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-blackboxz-dark text-sm">
                            {printer.name}
                          </h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            printer.status === 'online' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {printer.status === 'online' ? 'Online' : 'Offline'}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Sisa Kertas:</span>
                            <div className="flex items-center gap-1">
                              {printer.paperCount < 50 && printer.paperCount > 0 && (
                                <AlertTriangle className="w-3 h-3 text-orange-500" />
                              )}
                              <span className={`font-bold text-sm ${paperStatus.color}`}>
                                {printer.paperCount}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${paperStatus.bg} ${paperStatus.color}`}>
                              {paperStatus.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blackboxz-dark py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-300">
            Butuh bantuan? Hubungi petugas kiosk
          </p>
        </div>
      </footer>
      
      {/* Print Confirmation Modal */}
      <PrintConfirmationModal 
        isOpen={showPrintModal}
        onClose={handleCloseModal}
        printJobData={printJobData}
        printCode={printCode}
      />
    </div>
  );
}

export default PrintCodeInput;