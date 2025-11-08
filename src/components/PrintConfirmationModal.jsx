import { useState, useRef, useEffect } from 'react';
import { X, FileText, Image, CreditCard, Clock, Phone, Printer, AlertTriangle } from 'lucide-react';
import { usePrint } from '../hooks/usePrint';
import { useKiosk } from '../hooks/useKiosk';

function PrintConfirmationModal({ isOpen, onClose, printJobData, printCode }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(null);
  const [printDetected, setPrintDetected] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, isLandscape: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { executePrint } = usePrint();
  const { refreshKioskData, getPrinters } = useKiosk();
  const previewIframeRef = useRef(null);
  const pdfPreviewIframeRef = useRef(null);
  const printIframeRef = useRef(null);

  // Determine file type and URL
  const isPhotoType = printJobData?.print_type === 'PHOTO' || printJobData?.file_name?.match(/\.(jpg|jpeg|png|gif|bmp)$/i);
  const fileUrl = printJobData?.file_url;

  // Get printer data for paper validation
  const printers = getPrinters();

  // Calculate required pages for printing
  const getRequiredPages = () => {
    if (!printJobData) return 0;

    if (isPhotoType) {
      const photoQuantity = printJobData.photo_quantity || 1;
      const photoSize = printJobData.photo_size || 'SIZE_4R';

      const getPhotosPerPage = (size) => {
        switch (size) {
          case 'SIZE_2R': return 2;
          case 'SIZE_3R': return 1;
          case 'SIZE_4R': return 1;
          case 'SIZE_5R': return 1;
          case 'SIZE_6R': return 1;
          default: return 1;
        }
      };

      const photosPerPage = getPhotosPerPage(photoSize);
      return Math.ceil(photoQuantity / photosPerPage);
    } else {
      return printJobData.page_count || 1;
    }
  };

  // Check if there's enough paper
  const checkPaperAvailability = () => {
    if (!printJobData) {
      return {
        hasEnoughPaper: true,
        requiredPages: 0,
        availablePaper: 0
      };
    }

    const requiredPages = getRequiredPages();
    const availablePaper = printers.reduce((total, printer) => {
      const matches = isPhotoType ? printer.category === 'PHOTO' : printer.category !== 'PHOTO';
      return total + (matches ? (printer.paper_count || 0) : 0);
    }, 0);

    return {
      hasEnoughPaper: availablePaper >= requiredPages,
      requiredPages,
      availablePaper
    };
  };

  const paperStatus = checkPaperAvailability();

  // Function to detect image dimensions
  const detectImageDimensions = (url) => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const isLandscape = img.width > img.height;
        const dimensions = {
          width: img.width,
          height: img.height,
          isLandscape
        };
        setImageDimensions(dimensions);
        resolve(dimensions);
      };
      img.onerror = () => {
        const fallback = { width: 0, height: 0, isLandscape: false };
        setImageDimensions(fallback);
        resolve(fallback);
      };
      img.src = url;
    });
  };

  // Setup print event listeners
  useEffect(() => {
    if (!isOpen || !iframeLoaded) return;

    const handleBeforePrint = () => {
      console.log('Print dialog opened');
      setPrintDetected(true);
    };

    const handleAfterPrint = () => {
      console.log('Print dialog closed');
      if (printDetected) {
        handlePrintSuccess();
      }
    };

    // Add listeners to window and iframe
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    // Try to add listeners to iframe if accessible
    try {
      if (previewIframeRef.current?.contentWindow) {
        previewIframeRef.current.contentWindow.addEventListener('beforeprint', handleBeforePrint);
        previewIframeRef.current.contentWindow.addEventListener('afterprint', handleAfterPrint);
      }
    } catch (error) {
      console.log('Cannot access iframe events due to CORS, using window events only');
    }

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      
      try {
        if (previewIframeRef.current?.contentWindow) {
          previewIframeRef.current.contentWindow.removeEventListener('beforeprint', handleBeforePrint);
          previewIframeRef.current.contentWindow.removeEventListener('afterprint', handleAfterPrint);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [isOpen, iframeLoaded, printDetected]);

  // Handle successful print
  const handlePrintSuccess = async () => {
    setIsPrinting(true);
    
    try {
      await executePrint(printCode, isPhotoType ? 'PHOTO' : 'DOCUMENT');
      console.log('Print job marked as completed');
      
      // Refetch kiosk data to update paper count
      await refreshKioskData();
      console.log('Kiosk data refreshed after successful print');
      
      // Close modal after successful API call
      onClose();
    } catch (error) {
      console.error('Failed to execute print API:', error);
      alert('Gagal menandai print job sebagai selesai. Silakan coba lagi.');
    } finally {
      setIsPrinting(false);
      setPrintDetected(false);
    }
  };

  // Handle photo print button click
  const handlePhotoPrintClick = () => {
    if (printIframeRef.current) {
      const printWindow = printIframeRef.current.contentWindow;
      if (printWindow) {
        printWindow.print();
      }
    }
  };

  // Photo print handling with preview
  const handlePhotoPrint = async () => {
    const photoUrl = fileUrl;
    const photoSize = printJobData.photo_size || 'SIZE_4R';
    const photoQuantity = printJobData.photo_quantity || 1;

    // Detect image dimensions first
    const dimensions = await detectImageDimensions(photoUrl);

    // Get photo configuration
    const getPhotoConfig = (size) => {
      switch (size) {
        case 'SIZE_2R': return { photosPerPage: 2, width: '6cm', height: '9cm', gridCols: 2 };
        case 'SIZE_3R': return { photosPerPage: 1, width: '9cm', height: '13cm', gridCols: 1 };
        case 'SIZE_4R': return { photosPerPage: 1, width: '10cm', height: '15cm', gridCols: 1 };
        case 'SIZE_5R': return { photosPerPage: 1, width: '13cm', height: '18cm', gridCols: 1 };
        case 'SIZE_6R': return { photosPerPage: 1, width: '15cm', height: '20cm', gridCols: 1 };
        default: return { photosPerPage: 1, width: '10cm', height: '15cm', gridCols: 1 };
      }
    };

    const photoConfig = getPhotoConfig(photoSize);
    const actualPhotosToShow = Math.min(photoQuantity, photoConfig.photosPerPage);
    const shouldRotate = dimensions.isLandscape && ['SIZE_2R', 'SIZE_3R', 'SIZE_4R'].includes(photoSize);
    const rotationStyle = shouldRotate ? 'transform: rotate(90deg);' : '';

    // Create HTML content for photo printing and preview
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Photo Preview</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 10mm;
            font-family: Arial, sans-serif;
          }
          .photo-grid {
            display: grid;
            gap: 5mm;
            width: 100%;
            height: 100%;
            grid-template-columns: repeat(${photoConfig.gridCols}, 1fr);
            place-items: center;
            justify-content: center;
            max-width: 21cm;
            max-height: 29.7cm;
          }
          .photo-item {
            width: ${photoConfig.width};
            height: ${photoConfig.height};
            display: flex;
            justify-content: center;
            align-items: center;
            border: 2px solid #ddd;
            overflow: hidden;
            position: relative;
            background: #f9f9f9;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .photo-item::before {
            content: '${photoSize}';
            position: absolute;
            top: 2px;
            left: 2px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 6px;
            font-size: 10px;
            border-radius: 2px;
            z-index: 1;
          }
          img {
            ${shouldRotate ? `
              width: ${photoConfig.height};
              height: ${photoConfig.width};
            ` : `
              width: 100%;
              height: 100%;
            `}
            object-fit: contain;
            object-position: center;
            background: white;
            ${rotationStyle}
          }
          .orientation-info {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 10;
          }
          @media print {
            body { margin: 0; padding: 5mm; }
            .photo-grid { gap: 3mm; }
            .photo-item { border: none; background: white; box-shadow: none; }
            .photo-item::before { display: none; }
            .orientation-info { display: none; }
            img { page-break-inside: avoid; object-fit: contain; }
            @page { margin: 5mm; size: A4; }
          }
        </style>
      </head>
      <body>
        <div class="photo-grid">
          ${Array.from({ length: actualPhotosToShow }, (_, index) => `
            <div class="photo-item">
              <img src="${photoUrl}" alt="Photo ${index + 1}" />
            </div>
          `).join('')}
        </div>
        <div class="orientation-info">
          📸 ${dimensions.isLandscape ? 'Landscape' : 'Portrait'} • ${photoQuantity} foto • ${photoSize}
          ${shouldRotate ? ' • Rotated for optimal print' : ''}
        </div>
      </body>
      </html>
    `;

    // Update both preview and print iframes
    if (previewIframeRef.current) {
      const previewIframe = previewIframeRef.current;
      const previewDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
      previewDoc.open();
      previewDoc.write(printContent);
      previewDoc.close();
    }

    if (printIframeRef.current) {
      const printIframe = printIframeRef.current;
      const printDoc = printIframe.contentDocument || printIframe.contentWindow.document;
      printDoc.open();
      printDoc.write(printContent);
      printDoc.close();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  // Initialize photo print content when modal opens
  useEffect(() => {
    if (isOpen && isPhotoType && printJobData) {
      handlePhotoPrint();
    }
  }, [isOpen, isPhotoType, printJobData]);

  if (!isOpen || !printJobData) return null;

  return (
    <>
      {/* Main Print Confirmation Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blackboxz-dark to-blackboxz-gray p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mx-auto">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Printer className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white">Konfirmasi Print</h2>
                  <p className="text-orange-300 text-sm">Klik tombol print di preview untuk mencetak</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-orange-300 transition-colors p-2 absolute top-4 right-4"
                disabled={true}
                style={{ display: 'none' }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Print Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">!</span>
                </div>
                <div className="text-justify">
                  <h4 className="font-semibold text-blue-800 mb-2">Cara Mencetak:</h4>
                  <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside mx-auto">
                    <li className="flex">
                      <span>1. Klik tombol <strong>Print (🖨️)</strong> yang ada di toolbar preview di bawah</span>
                    </li>
                    <li className="flex">
                      <span>2. Pilih printer yang tersedia di dialog print</span>
                    </li>
                    <li className="flex">
                      <span>3. Klik "Print" untuk memulai pencetakan</span>
                    </li>
                    <li className="flex">
                      <span>4. Klik <strong> "Selesai" </strong> setelah proses cetak berhasil</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Printer Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Printer className="w-5 h-5 text-gray-600" />
                Informasi Printer
                <span className="text-xs text-gray-500 ml-2">
                  ({isPhotoType ? 'Untuk Foto' : 'Untuk Dokumen'})
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {printers.length > 0 ? (
                  printers.map((printer, index) => {
                    const isMatchingType = isPhotoType 
                      ? printer.category === 'PHOTO' 
                      : printer.category !== 'PHOTO';
                    
                    return (
                      <div 
                        key={printer.id || index} 
                        className={`flex flex-col p-3 rounded-lg border transition-all duration-200 ${
                          isMatchingType 
                            ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-300 shadow-md ring-2 ring-green-200' 
                            : 'bg-white border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            printer.is_online ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <p className={`font-medium text-sm ${
                            isMatchingType ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {printer.name || `Printer ${index + 1}`}
                          </p>
                          {isMatchingType && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200">
                              ✓
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${
                            isMatchingType ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            Kertas: {printer.paper_count || 0}
                          </p>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              printer.category === 'PHOTO' 
                                ? isMatchingType 
                                  ? 'bg-purple-200 text-purple-900 border-2 border-purple-300' 
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                                : isMatchingType 
                                  ? 'bg-blue-200 text-blue-900 border-2 border-blue-300' 
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {printer.category === 'PHOTO' ? '📸 FOTO' : '📄 DOKUMEN'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              printer.is_online 
                                ? isMatchingType 
                                  ? 'bg-green-200 text-green-900' 
                                  : 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {printer.is_online ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    <Printer className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Tidak ada printer yang tersedia</p>
                  </div>
                )}
              </div>
              {printers.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Pilih printer yang disorot untuk mencetak {isPhotoType ? 'foto' : 'dokumen'} Anda
                  </p>
                </div>
              )}
            </div>

            {/* Preview dengan highlight */}
            <div className="bg-gray-50 rounded-xl p-4 relative">
              <h3 className="font-semibold text-blackboxz-dark mb-3 flex items-center gap-2">
                {isPhotoType ? (
                  <Image className="w-5 h-5 text-blue-600" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-600" />
                )}
                Preview {isPhotoType ? 'Foto' : 'File'}
                {iframeLoaded && <span className="text-green-600 text-xs ml-2">✓ Ready to Print</span>}
                {iframeError && <span className="text-red-600 text-xs ml-2">✗ Error</span>}
              </h3>
              
              {/* Print Button for Photo */}
              {isPhotoType && iframeLoaded && (
                <div className="flex justify-center mb-3">
                  <button
                    onClick={handlePhotoPrintClick}
                    disabled={isPrinting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105"
                  >
                    <Printer className="w-5 h-5" />
                    {isPrinting ? 'Mencetak...' : 'Print Foto'}
                  </button>
                </div>
              )}

              {/* Highlight overlay untuk tombol print - hanya untuk PDF */}
              {iframeLoaded && !isPhotoType && (
                <div className="absolute top-12 right-1 z-10 pointer-events-none">
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
                    Klik tombol Print di sini!
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
                </div>
              )}
              
              <div className="border rounded-lg overflow-hidden bg-white relative">
                {isPhotoType ? (
                  // Photo preview with iframe
                  <>
                    {!iframeLoaded && !iframeError && (
                      <div className="flex items-center justify-center h-96 text-gray-500">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p>Loading Photo Preview...</p>
                        </div>
                      </div>
                    )}

                    <iframe
                      ref={previewIframeRef}
                      className="w-full h-96 border border-gray-300 rounded"
                      title="Photo Print Preview"
                      onLoad={() => {
                        console.log('Photo preview iframe loaded successfully');
                        setIframeLoaded(true);
                      }}
                      onError={() => {
                        console.error('Photo preview iframe failed to load');
                        setIframeError('Failed to load photo preview');
                      }}
                    />

                    {iframeError && (
                      <div className="flex items-center justify-center h-96 text-red-500 bg-red-50">
                        <div className="text-center">
                          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                          <p className="font-medium">Gagal memuat preview foto</p>
                          <p className="text-sm text-red-400 mt-1">Silakan coba refresh halaman</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // PDF preview
                  <>
                    {!iframeLoaded && !iframeError && (
                      <div className="flex items-center justify-center h-96 text-gray-500">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p>Loading PDF...</p>
                        </div>
                      </div>
                    )}

                    <iframe
                      ref={pdfPreviewIframeRef}
                      src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fileUrl)}`}
                      className="w-full h-96 border border-gray-300 rounded"
                      title="Print Preview"
                      onLoad={() => {
                        console.log('Preview iframe loaded successfully');
                        setIframeLoaded(true);
                      }}
                      onError={() => {
                        console.error('Preview iframe failed to load');
                        setIframeError(true);
                      }}
                    />

                    {iframeError && (
                      <div className="flex items-center justify-center h-96 text-red-500 bg-red-50">
                        <div className="text-center">
                          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                          <p className="font-medium">Gagal memuat preview</p>
                          <p className="text-sm text-red-400 mt-1">Silakan coba refresh halaman</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Paper Status Warning */}
            {!paperStatus.hasEnoughPaper && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-800">Kertas Tidak Mencukupi!</h4>
                    <p className="text-red-600 text-sm mt-1">
                      Dibutuhkan {paperStatus.requiredPages} lembar, tersedia {paperStatus.availablePaper} lembar.
                      Silakan isi kertas terlebih dahulu.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Info */}
          </div>

          {/* Footer - Simplified */}
          <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
            <div className="flex justify-center gap-4">
              <button
                onClick={handlePrintSuccess}
                disabled={isPrinting || !iframeLoaded}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isPrinting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Selesai
                  </>
                )}
              </button>
            </div>
            
            {isPrinting && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Memproses print job...</span>
                </div>
              </div>
            )}
            
            {printDetected && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-green-600">
                  <span className="text-sm font-medium">✓ Print terdeteksi! Menunggu selesai...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden iframe for photo printing */}
      <iframe
        ref={printIframeRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: 'none',
          visibility: 'hidden',
          top: '-9999px',
          left: '-9999px'
        }}
        title="Print Frame"
      />
    </>
  );
}

export default PrintConfirmationModal;