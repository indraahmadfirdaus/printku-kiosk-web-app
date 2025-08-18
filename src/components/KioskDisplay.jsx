import { useState } from 'react';
import { Settings, AlertCircle, Monitor, MapPin, Wifi, WifiOff } from 'lucide-react';
import KioskSetupModal from './KioskSetupModal';

function KioskDisplay({ 
  kioskCode = null,
  kioskData = null,
  isSetupRequired = true,
  className = "",
  theme = "blackboxz"
}) {
  const [showSetupModal, setShowSetupModal] = useState(false);

  const getThemeClasses = () => {
    if (theme === 'blackboxz') {
      return {
        container: 'bg-white border-2 border-blackboxz-primary/20 shadow-lg hover:border-blackboxz-primary/40',
        text: 'text-blackboxz-dark',
        code: 'text-blackboxz-primary',
        setupText: 'text-orange-600',
        setupBg: 'bg-orange-50',
        onlineText: 'text-green-600',
        offlineText: 'text-red-600',
        onlineBg: 'bg-green-50',
        offlineBg: 'bg-red-50'
      };
    }
    
    if (theme === 'light') {
      return {
        container: 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300',
        text: 'text-gray-800',
        code: 'text-blue-600',
        setupText: 'text-orange-600',
        setupBg: 'bg-orange-50',
        onlineText: 'text-green-600',
        offlineText: 'text-red-600',
        onlineBg: 'bg-green-50',
        offlineBg: 'bg-red-50'
      };
    }
    
    // Default fallback
    return {
      container: 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300',
      text: 'text-gray-800',
      code: 'text-blue-600',
      setupText: 'text-orange-600',
      setupBg: 'bg-orange-50',
      onlineText: 'text-green-600',
      offlineText: 'text-red-600',
      onlineBg: 'bg-green-50',
      offlineBg: 'bg-red-50'
    };
  };

  const themeClasses = getThemeClasses();

  const handleClick = () => {
    setShowSetupModal(true);
  };

  return (
    <>
      <div className={`${className}`}>
        <div 
          onClick={handleClick}
          className={`${themeClasses.container} rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-105`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-gray-500" />
              <span className={`text-sm font-medium ${themeClasses.text}`}>
                Info Kiosk
              </span>
            </div>
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
          
          {kioskData ? (
            <div className="space-y-3">
              {/* Kode Kiosk */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Kode:</span>
                <span className={`text-sm font-mono font-bold ${themeClasses.code} tracking-wider`}>
                  {kioskCode}
                </span>
              </div>
              
              {/* Nama Kiosk */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Nama:</span>
                <span className={`text-sm font-semibold ${themeClasses.text}`}>
                  {kioskData.name}
                </span>
              </div>
              
              {/* Lokasi */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Lokasi:</span>
                </div>
                <span className={`text-sm ${themeClasses.text}`}>
                  {kioskData.location}
                </span>
              </div>
              
              {/* Status Online */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status:</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                  kioskData.is_online ? themeClasses.onlineBg : themeClasses.offlineBg
                }`}>
                  {kioskData.is_online ? (
                    <Wifi className="w-3 h-3 text-green-600" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${
                    kioskData.is_online ? themeClasses.onlineText : themeClasses.offlineText
                  }`}>
                    {kioskData.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-lg font-mono text-gray-400 tracking-wider mb-2">
                BELUM DISET
              </div>
              <div className="text-xs text-gray-500">
                Klik untuk setup kiosk
              </div>
            </div>
          )}
          
          {isSetupRequired && (
            <div className={`mt-3 p-2 ${themeClasses.setupBg} rounded-lg flex items-center gap-2`}>
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className={`text-xs font-medium ${themeClasses.setupText}`}>
                Klik untuk setup kiosk
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Kiosk Setup Modal - Direct Access */}
      <KioskSetupModal 
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        currentKioskCode={kioskCode}
        theme={theme}
      />
    </>
  );
}

export default KioskDisplay;