import useKioskStore from '../stores/kioskStore';

export const useKiosk = () => {
  const {
    kioskCode,
    kioskData,
    isSetupRequired,
    setKioskCode,
    setKioskData,
    clearKioskData,
    getPrinters,
    getKioskInfo
  } = useKioskStore();

  const refreshKioskData = async () => {
    if (!kioskCode) return;

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8181';
      const response = await fetch(`${BASE_URL}/kiosks/code/${kioskCode}`);
      
      if (response.ok) {
        const result = await response.json();
        // Hanya simpan data yang ada di dalam key "data"
        setKioskData(result.data);
      }
    } catch (error) {
      console.error('Failed to refresh kiosk data:', error);
    }
  };

  return {
    kioskCode,
    kioskData,
    isSetupRequired,
    setKioskCode,
    setKioskData,
    clearKioskData,
    refreshKioskData,
    getPrinters,
    getKioskInfo
  };
};