import { useState, useEffect } from 'react';
import { X, Monitor, Wifi, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import VirtualKeyboard from './VirtualKeyboard';
import InputDisplay from './InputDisplay';
import useKioskStore from '../stores/kioskStore';

function KioskSetupModal({ 
  isOpen, 
  onClose, 
  theme = "blackboxz" 
}) {
  const [kioskCode, setKioskCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Zustand store
  const { setKioskCode: setStoreKioskCode, setKioskData } = useKioskStore();

  if (!isOpen) return null;

  const getThemeClasses = () => {
    if (theme === 'blackboxz') {
      return {
        overlay: 'bg-black/50 backdrop-blur-sm',
        modal: 'bg-white',
        header: 'border-gray-200',
        button: 'bg-blackboxz-primary text-white hover:bg-blackboxz-secondary',
        buttonDisabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
        activeField: 'border-blackboxz-primary bg-blackboxz-primary/5',
        inactiveField: 'border-gray-200 bg-gray-50 hover:border-gray-300'
      };
    }
    
    if (theme === 'light') {
      return {
        overlay: 'bg-black/50 backdrop-blur-sm',
        modal: 'bg-white',
        header: 'border-gray-200',
        button: 'bg-blue-600 text-white hover:bg-blue-700',
        buttonDisabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
        activeField: 'border-blue-500 bg-blue-50',
        inactiveField: 'border-gray-200 bg-gray-50 hover:border-gray-300'
      };
    }
    
    // Default fallback
    return {
      overlay: 'bg-black/50 backdrop-blur-sm',
      modal: 'bg-white',
      header: 'border-gray-200',
      button: 'bg-blue-600 text-white hover:bg-blue-700',
      buttonDisabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
      activeField: 'border-blue-500 bg-blue-50',
      inactiveField: 'border-gray-200 bg-gray-50 hover:border-gray-300'
    };
  };

  const themeClasses = getThemeClasses();

  const handleKeyPress = (key) => {
    if (key === 'DELETE') {
      setKioskCode(prev => prev.slice(0, -1));
    } else if (key === 'CLEAR') {
      setKioskCode('');
    } else {
      const finalKey = key.toUpperCase();
      setKioskCode(prev => prev + finalKey);
    }
  };

  const handleSubmit = async () => {
    if (kioskCode.length < 1) {
      toast.error('Kode kiosk harus diisi');
      return;
    }

    setIsLoading(true);

    try {
      // Validasi kiosk code dengan API
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8181';
      const response = await fetch(`${BASE_URL}/api/kiosks/code/${kioskCode}`);
      
      const result = await response.json();
      
      // Check if API response indicates failure
      if (!response.ok || !result.success) {
        // Use message from API response if available
        toast.error(result.message || 'Kode kiosk tidak valid atau tidak ditemukan');
        return;
      }
      
      // Simpan ke Zustand store - hanya data yang di dalam key "data"
      setStoreKioskCode(kioskCode);
      setKioskData(result.data);
      
      setSuccess(true);
      toast.success(`Setup berhasil! Kiosk: ${result.data.name}`);
      
      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan saat validasi kiosk code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setKioskCode('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className={`fixed inset-0 ${themeClasses.overlay} flex items-center justify-center z-50 p-4`}>
      <div className={`${themeClasses.modal} rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${themeClasses.header}`}>
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-blackboxz-primary" />
            <h2 className="text-xl font-bold">Setup Kiosk</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-2">Setup Berhasil!</h3>
              <p className="text-gray-600">
                Kiosk telah berhasil dikonfigurasi dengan kode: <strong>{kioskCode}</strong>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Input Field */}
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-blackboxz-dark mb-2">
                    Masukkan Kode Kiosk
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Masukkan kode kiosk yang telah terdaftar untuk mengakses sistem.
                  </p>
                </div>

                {/* Hapus bagian error display ini karena sudah pakai toast */}
                {/* {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )} */}

                {/* Kiosk Code Field */}
                <div className={`p-4 rounded-lg border-2 ${themeClasses.activeField}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-blackboxz-primary" />
                    <label className="text-sm font-medium text-gray-700">
                      Kode Kiosk
                    </label>
                  </div>
                  <InputDisplay 
                    value={kioskCode}
                    placeholder="Masukkan kode kiosk"
                    maxLength={50}
                    theme={theme}
                    className="mb-0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kode identifikasi kiosk yang terdaftar
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || kioskCode.length < 1}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                      isLoading || kioskCode.length < 1
                        ? themeClasses.buttonDisabled
                        : themeClasses.button
                    }`}
                  >
                    {isLoading ? 'Memvalidasi...' : 'Simpan Kode'}
                  </button>
                </div>
              </div>

              {/* Right Side - Virtual Keyboard */}
              <div className="flex flex-col">
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">
                    Virtual Keyboard
                  </h4>
                  <p className="text-sm text-gray-500">
                    Gunakan keyboard virtual untuk memasukkan kode kiosk
                  </p>
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  <VirtualKeyboard 
                    onKeyPress={handleKeyPress}
                    theme={theme}
                    keySize="h-12 w-12"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {!success && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Petunjuk:</strong> 
                <br />• Masukkan kode kiosk yang telah terdaftar di sistem
                <br />• Kode akan divalidasi dengan server
                <br />• Setelah berhasil, kode akan disimpan untuk penggunaan selanjutnya
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KioskSetupModal;