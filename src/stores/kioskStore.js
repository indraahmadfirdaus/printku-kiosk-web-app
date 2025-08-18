import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useKioskStore = create(
  persist(
    (set, get) => ({
      // State
      kioskCode: null,
      kioskData: null,
      isSetupRequired: true,
      
      // Actions
      setKioskCode: (code) => set({ kioskCode: code }),
      
      setKioskData: (data) => set({ 
        kioskData: data,
        isSetupRequired: false 
      }),
      
      clearKioskData: () => set({ 
        kioskCode: null,
        kioskData: null,
        isSetupRequired: true 
      }),
      
      // Helper untuk mendapatkan printer data
      getPrinters: () => {
        const { kioskData } = get();
        return kioskData?.printers || [];
      },
      
      // Helper untuk mendapatkan kiosk info
      getKioskInfo: () => {
        const { kioskData } = get();
        if (!kioskData) return null;
        
        return {
          id: kioskData.id,
          name: kioskData.name,
          location: kioskData.location,
          isOnline: kioskData.is_online,
          createdAt: kioskData.created_at,
          updatedAt: kioskData.updated_at
        };
      }
    }),
    {
      name: 'kiosk-storage', // localStorage key
      partialize: (state) => ({ 
        kioskCode: state.kioskCode,
        kioskData: state.kioskData,
        isSetupRequired: state.isSetupRequired
      })
    }
  )
);

export default useKioskStore;