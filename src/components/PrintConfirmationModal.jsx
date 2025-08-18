import { useState, useRef, useEffect } from 'react';
import { X, FileText, Image, CreditCard, Clock, Phone, Printer, Heart, Smile, AlertTriangle } from 'lucide-react';
import { usePrint } from '../hooks/usePrint';
import { useKiosk } from '../hooks/useKiosk';

function PrintConfirmationModal({ isOpen, onClose, printJobData, printCode }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(null);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, isLandscape: false });
  
  // Add timer refs for auto close
  const confirmTimerRef = useRef(null);
  const thankYouTimerRef = useRef(null);
  
  const { executePrint } = usePrint();
  const { refreshKioskData, getPrinters } = useKiosk();
  const previewIframeRef = useRef(null);
  const printIframeRef = useRef(null);

  // URL testing dengan Cloudflare tunnel
  const testPdfUrl = printJobData?.file_url;

  // Deteksi apakah ini foto atau dokumen
  const isPhotoType = printJobData?.print_type === 'PHOTO' || printJobData?.file_name?.match(/\.(jpg|jpeg|png|gif|bmp)$/i);
  
  // Get actual image URL from API data
  const imageUrl = printJobData?.file_url;

  // Get printer data for paper validation
  const printers = getPrinters();
  
  // Calculate required pages for printing
  const getRequiredPages = () => {
    if (!printJobData) return 0; // Add null check
    
    if (isPhotoType) {
      const photoQuantity = printJobData.photo_quantity || 1;
      const photoSize = printJobData.photo_size || 'SIZE_4R';
      
      // Calculate pages based on photo size and quantity
      const getPhotosPerPage = (size) => {
        switch(size) {
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
    if (!printJobData) { // Add null check
      return {
        hasEnoughPaper: true,
        requiredPages: 0,
        availablePaper: 0
      };
    }
    
    const requiredPages = getRequiredPages();
    const availablePaper = printers.reduce((total, printer) => {
      return total + (printer.paper_count || 0);
    }, 0);
    
    return {
      hasEnoughPaper: availablePaper >= requiredPages,
      requiredPages,
      availablePaper
    };
  };
  
  const paperStatus = checkPaperAvailability();

  // Function to detect image dimensions
  const detectImageDimensions = (imageUrl) => {
    return new Promise((resolve) => {
      // Fix: Use document.createElement instead of new Image()
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
        // Fallback if image fails to load
        const fallback = { width: 0, height: 0, isLandscape: false };
        setImageDimensions(fallback);
        resolve(fallback);
      };
      img.src = imageUrl;
    });
  };

  // Tentukan berapa foto per kertas dan dimensi berdasarkan ukuran
  const getPhotoConfig = (size) => {
    switch(size) {
      case 'SIZE_2R': return { 
        photosPerPage: 2, 
        width: '6cm', 
        height: '9cm',
        gridCols: 2
      };
      case 'SIZE_3R': return { 
        photosPerPage: 1, 
        width: '9cm', 
        height: '13cm',
        gridCols: 1
      };
      case 'SIZE_4R': return { 
        photosPerPage: 1, 
        width: '10cm', 
        height: '15cm',
        gridCols: 1
      };
      case 'SIZE_5R': return { 
        photosPerPage: 1, 
        width: '13cm', 
        height: '18cm',
        gridCols: 1
      };
      case 'SIZE_6R': return { 
        photosPerPage: 1, 
        width: '15cm', 
        height: '20cm',
        gridCols: 1
      };
      default: return { 
        photosPerPage: 1, 
        width: '10cm', 
        height: '15cm',
        gridCols: 1
      };
    }
  };

  // Print handler dengan paper validation
  const handlePrint = async () => {
    // Check paper availability first
    if (!paperStatus.hasEnoughPaper) {
      alert(`Kertas tidak mencukupi! Dibutuhkan ${paperStatus.requiredPages} lembar, tersedia ${paperStatus.availablePaper} lembar.`);
      return;
    }
    
    // Fix condition: untuk photo tidak perlu previewIframeRef
    if (isPrinting || (!iframeLoaded && !isPhotoType)) return;
    
    // Untuk PDF, pastikan previewIframeRef ada
    if (!isPhotoType && !previewIframeRef.current) return;
    
    setIsPrinting(true);
    
    try {
      if (isPhotoType) {
        // Handle photo printing dengan hidden iframe
        await handlePhotoPrint();
      } else {
        // Handle PDF printing (existing logic)
        await handlePdfPrint();
      }
    } catch (error) {
      console.error('Print error:', error);
      setIsPrinting(false);
    }
  };

  // Enhanced PDF print logic with auto close
  const handlePdfPrint = async () => {
    const iframeWindow = previewIframeRef.current.contentWindow;
    console.log(iframeWindow);
    
    if (iframeWindow) {
      iframeWindow.print();
      
      setTimeout(() => {
        // Auto close after 10 seconds if no user interaction
        confirmTimerRef.current = setTimeout(() => {
          console.log('Auto confirming print success after timeout');
          executePrint(printCode)
            .then(() => {
              console.log('Print job marked as completed (auto)');
              onClose();
            })
            .catch((error) => {
              console.error('Failed to execute print API:', error);
              alert('Gagal menandai print job sebagai selesai');
            })
            .finally(() => {
              setIsPrinting(false);
            });
        }, 10000); // 10 seconds auto close
        
        const userConfirmed = window.confirm(
          'Apakah dokumen sudah berhasil dicetak? Klik OK jika sudah dicetak, Cancel jika dibatalkan. (Auto OK dalam 10 detik)'
        );
        
        // Clear timer if user interacted
        if (confirmTimerRef.current) {
          clearTimeout(confirmTimerRef.current);
          confirmTimerRef.current = null;
        }
        
        if (userConfirmed) {
          executePrint(printCode)
            .then(() => {
              console.log('Print job marked as completed');
              onClose();
            })
            .catch((error) => {
              console.error('Failed to execute print API:', error);
              alert('Gagal menandai print job sebagai selesai');
            })
            .finally(() => {
              setIsPrinting(false);
            });
        } else {
          console.log('Print cancelled by user');
          setIsPrinting(false);
        }
      }, 1000);
    } else {
      console.error('Iframe content window not accessible');
      setIsPrinting(false);
    }
  };

  // New photo print logic - Fixed and consolidated
  const handlePhotoPrint = async () => {
    const photoUrl = imageUrl;
    const photoSize = printJobData.photo_size || 'SIZE_4R';
    const photoQuantity = printJobData.photo_quantity || 1;
    
    // Detect image dimensions first
    const dimensions = await detectImageDimensions(photoUrl);
    
    // Get photo configuration
    const photoConfig = getPhotoConfig(photoSize);
    const photosPerPage = photoConfig.photosPerPage;
    
    // Calculate how many photos to show (limit to photosPerPage for now)
    const actualPhotosToShow = Math.min(photoQuantity, photosPerPage);
    
    // Determine if we should rotate the image (only for 2R, 3R, 4R)
    const shouldRotate = dimensions.isLandscape && ['SIZE_2R', 'SIZE_3R', 'SIZE_4R'].includes(photoSize);
    const rotationStyle = shouldRotate ? 'transform: rotate(90deg);' : '';
    
    // Create HTML content for photo printing
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Photo</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 10mm;
          }
          .photo-grid {
            display: grid;
            gap: 5mm;
            width: 100%;
            height: 100%;
            grid-template-columns: repeat(${photoConfig.gridCols}, 1fr);
            place-items: center;
            justify-content: center;
          }
          .photo-item {
            width: ${photoConfig.width};
            height: ${photoConfig.height};
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1px solid #ddd;
            overflow: hidden;
            position: relative;
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
          @media print {
            body { 
              margin: 0; 
              padding: 5mm;
            }
            .photo-grid {
              gap: 3mm;
            }
            .photo-item {
              border: none;
              background: white;
            }
            img {
              page-break-inside: avoid;
              object-fit: contain;
            }
            @page { 
              margin: 5mm;
              size: A4;
            }
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
      </body>
      </html>
    `;
    
    // Use hidden iframe for printing
    if (printIframeRef.current) {
      const iframe = printIframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(printContent);
      doc.close();
      
      // Fix: Remove duplicate print triggers and use single confirmation
      let printTriggered = false;
      
      iframe.onload = () => {
        if (!printTriggered) {
          printTriggered = true;
          setTimeout(() => {
            try {
              iframe.contentWindow.print();
              
              // Add confirmation dialog like PDF print
              setTimeout(() => {
                // Auto close after 10 seconds if no user interaction
                confirmTimerRef.current = setTimeout(() => {
                  console.log('Auto confirming photo print success after timeout');
                  setShowThankYouModal(true);
                }, 5000); // 10 seconds auto close
                
                const userConfirmed = window.confirm(
                  'Apakah foto sudah berhasil dicetak? Klik OK jika sudah dicetak, Cancel jika dibatalkan. (Auto OK dalam 5 detik)'
                );
                
                // Clear timer if user interacted
                if (confirmTimerRef.current) {
                  clearTimeout(confirmTimerRef.current);
                  confirmTimerRef.current = null;
                }
                
                if (userConfirmed) {
                  // Show thank you modal only if user confirms print success
                  setShowThankYouModal(true);
                } else {
                  console.log('Photo print cancelled by user');
                  setIsPrinting(false);
                }
              }, 1000);
              
            } catch (e) {
              console.error('Print error:', e);
              alert('Gagal mencetak foto. Silakan coba lagi.');
              setIsPrinting(false);
            }
          }, 500);
        }
      };
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

  // Handle thank you modal OK button
  const handleThankYouOk = async () => {
    try {
      await executePrint(printCode);
      console.log('Print job marked as completed');
      
      // Refetch kiosk data to update paper count
      await refreshKioskData();
      console.log('Kiosk data refreshed after successful print');
      
      setShowThankYouModal(false);
      onClose();
    } catch (error) {
      console.error('Failed to execute print API:', error);
      alert('Gagal menandai print job sebagai selesai');
    } finally {
      setIsPrinting(false);
    }
  };

  if (!isOpen || !printJobData) return null;

  return (
    <>
      {/* Main Print Confirmation Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blackboxz-dark to-blackboxz-gray p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mx-auto">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Printer className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white">Konfirmasi Print</h2>
                  <p className="text-orange-300 text-sm">Periksa detail sebelum mencetak</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-orange-300 transition-colors p-2 absolute top-4 right-4"
                disabled={isPrinting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Preview - Updated untuk support foto */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-blackboxz-dark mb-3 flex items-center gap-2">
                {isPhotoType ? (
                  <Image className="w-5 h-5 text-blue-600" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-600" />
                )}
                Preview {isPhotoType ? 'Foto' : 'File'}
                {(iframeLoaded || isPhotoType) && <span className="text-green-600 text-xs ml-2">✓ Ready to Print</span>}
                {iframeError && <span className="text-red-600 text-xs ml-2">✗ Error</span>}
              </h3>
              <div className="border rounded-lg overflow-hidden bg-white">
                {isPhotoType ? (
                  // Photo preview - Use actual image URL
                  <div className="text-center p-4">
                    <img
                      src={imageUrl}
                      alt="Photo preview"
                      className="max-w-full max-h-64 mx-auto object-contain border rounded"
                      onLoad={() => setIframeLoaded(true)}
                      onError={() => setIframeError('Failed to load photo')}
                    />
                  </div>
                ) : (
                  // PDF preview (existing)
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
                      ref={previewIframeRef}
                      src={testPdfUrl}
                      className="w-full h-64 border border-gray-300 rounded"
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
                      <div className="flex items-center justify-center h-96 text-red-500">
                        <div className="text-center">
                          <p>❌ {iframeError}</p>
                          <p className="text-xs text-gray-500 mt-1">Cannot print - file failed to load</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Print Job Info - Updated untuk show correct photo info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-blackboxz-dark mb-3 flex items-center gap-2">
                {isPhotoType ? (
                  <Image className="w-5 h-5 text-green-600" />
                ) : (
                  <FileText className="w-5 h-5 text-green-600" />
                )}
                Detail Print Job
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">File:</span>
                  <p className="font-medium text-blackboxz-dark">{printJobData.file_name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Print Code:</span>
                  <p className="font-medium text-blackboxz-dark">{printCode}</p>
                </div>
                <div>
                  <span className="text-gray-600">{isPhotoType ? 'Foto' : 'Halaman'}:</span>
                  <p className="font-medium text-blackboxz-dark">
                    {isPhotoType ? `${printJobData.photo_quantity || printJobData.page_count} foto` : `${printJobData.page_count} halaman`}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Warna:</span>
                  <p className="font-medium text-blackboxz-dark">
                    {isPhotoType ? 'Berwarna' : (printJobData.docs_color_type === 'COLOR' ? 'Berwarna' : 'Hitam Putih')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Ukuran:</span>
                  <p className="font-medium text-blackboxz-dark">
                    {isPhotoType ? printJobData.photo_size?.replace('SIZE_', '') : printJobData.paper_size}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Jumlah:</span>
                  <p className="font-medium text-blackboxz-dark">
                    {isPhotoType ? `${printJobData.photo_quantity} copy` : `${printJobData.page_count} copy`}
                  </p>
                </div>
              </div>
            </div>

            {/* Printer Selection Info - Tambahan untuk guidance */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Pilih Printer yang Tepat</p>
                </div>
              </div>
            </div>

            {/* Paper Status Warning */}
            {!paperStatus.hasEnoughPaper && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800 mb-1">Kertas Tidak Mencukupi</p>
                    <p className="font-medium text-red-800 mb-1">Segera hubungi petugas kiosk untuk melanjutkan</p> 
                    <p className="text-red-600">
                      Dibutuhkan {paperStatus.requiredPages} lembar, tersedia {paperStatus.availablePaper} lembar
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info - existing */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-blackboxz-dark mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Informasi Pembayaran
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Harga:</span>
                  <p className="font-medium text-blackboxz-dark">{formatCurrency(printJobData.total_price)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className={`font-medium ${
                    printJobData.status === 'PAID' 
                      ? 'text-green-600' 
                      : printJobData.status === 'PENDING' 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                  }`}>
                    {printJobData.status === 'PAID' 
                      ? 'Lunas' 
                      : printJobData.status === 'PENDING' 
                      ? 'Menunggu Pembayaran' 
                      : 'Belum Dibayar'}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Info - dengan perbaikan date */}
            {printJobData.customer_phone && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-blackboxz-dark mb-3 flex items-center gap-2 justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Informasi Customer
                </h3>
                
                  <div className="text-center">
                    <span className="text-gray-600">No. Telepon:</span>
                    <p className="font-medium text-blackboxz-dark">{printJobData.customer_phone}</p>
                  </div>
              </div>
            )}

            {/* Expiry Info - dengan perbaikan date */}
          </div>

          {/* Footer - centered */}
          <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                disabled={isPrinting}
              >
                Batal
              </button>
              
              {/* Conditional Print Button */}
              {printJobData.status === 'PAID' ? (
                <button
                  onClick={handlePrint}
                  disabled={isPrinting || (!iframeLoaded && !isPhotoType) || iframeError || !paperStatus.hasEnoughPaper}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                    isPrinting || (!iframeLoaded && !isPhotoType) || iframeError || !paperStatus.hasEnoughPaper
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blackboxz-dark to-blackboxz-gray text-white hover:from-blackboxz-gray hover:to-blackboxz-dark'
                  }`}
                >
                  {isPrinting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Mencetak...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      Cetak
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-red-600 font-medium mb-2">
                    {printJobData.status === 'PENDING' 
                      ? 'Menunggu pembayaran untuk melanjutkan'
                      : 'Print job sudah kadaluarsa atau belum dibayar'
                    }
                  </p>
                  <button
                    disabled
                    className="px-6 py-3 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed font-medium"
                  >
                    Tidak Dapat Dicetak
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden iframe for photo printing */}
      <iframe
        ref={printIframeRef}
        style={{ display: 'none' }}
        title="Photo Print Frame"
      />

      {/* Enhanced Thank You Modal with countdown */}
      {showThankYouModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-blackboxz-dark mb-2">
                Thank you for using BlackBoxZ :)
              </h3>
              <p className="text-gray-600 mb-4">
                Terima kasih telah menggunakan layanan print kami!
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Modal akan tertutup otomatis dalam {countdown} detik
              </p>
              <button
                onClick={handleThankYouOk}
                className="w-full px-6 py-3 bg-gradient-to-r from-blackboxz-dark to-blackboxz-gray text-white rounded-xl hover:from-blackboxz-gray hover:to-blackboxz-dark transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PrintConfirmationModal;