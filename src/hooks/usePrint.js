import { useState } from 'react';
import { useKiosk } from './useKiosk';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8181';

export const usePrint = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { getPrinters } = useKiosk();

  // GET - Validasi print code dan ambil data print job
  const validatePrintCode = async (printCode) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/jobs/code/${printCode}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to validate print code');
      }
      
      // Pastikan ada file_url di response
      if (!result.data.file_url) {
        console.warn('No file_url in response, print may not work properly');
      }
      
      return result.data;
    } catch (error) {
      console.error('Print code validation failed:', error);
      toast.error(error.message || 'Kode print tidak valid');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // POST - Execute print job
  const executePrint = async (printCode) => {
    setIsLoading(true);
    try {
      // Cari printer pertama yang sesuai dengan tipe print
      const printers = getPrinters();
      const availablePrinter = printers.find(printer => 
        printer.is_online && printer.paper_count > 0
      );
      
      if (!availablePrinter) {
        throw new Error('Tidak ada printer yang tersedia');
      }

      const response = await fetch(`${BASE_URL}/kiosks/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          print_code: printCode,
          printer_id: availablePrinter.id
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to execute print');
      }
      
      toast.success('Success');
      return result.data;
    } catch (error) {
      console.error('Print execution failed:', error);
      toast.error(error.message || 'Gagal mengirim ke printer');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    validatePrintCode,
    executePrint,
    isLoading
  };
};