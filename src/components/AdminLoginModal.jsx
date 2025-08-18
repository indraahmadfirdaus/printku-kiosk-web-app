import { useState } from 'react';
import { X, Eye, EyeOff, User, Lock } from 'lucide-react';
import KioskSetupModal from './KioskSetupModal';

function AdminLoginModal({ 
  isOpen, 
  onClose, 
  currentKioskCode = null,
  theme = "blackboxz" 
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showKioskSetup, setShowKioskSetup] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const getThemeClasses = () => {
    if (theme === 'blackboxz') {
      return {
        overlay: 'bg-black/50',
        modal: 'bg-white',
        header: 'text-blackboxz-dark border-blackboxz-primary/20',
        input: 'border-blackboxz-primary/20 focus:border-blackboxz-primary',
        button: 'bg-blackboxz-primary hover:bg-blackboxz-secondary text-white',
        buttonDisabled: 'bg-gray-200 text-gray-400'
      };
    }
    
    return {
      overlay: 'bg-black/50',
      modal: 'bg-white',
      header: 'text-gray-800 border-gray-200',
      input: 'border-gray-200 focus:border-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonDisabled: 'bg-gray-200 text-gray-400'
    };
  };

  const themeClasses = getThemeClasses();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulasi API call untuk login admin
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation - nanti ganti dengan API call
      if (email === 'admin@blackboxz.com' && password === 'admin123') {
        setShowKioskSetup(true);
      } else {
        setError('Email atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  const handleKioskSetupClose = () => {
    setShowKioskSetup(false);
    handleClose();
  };

  return (
    <>
      <div className={`fixed inset-0 ${themeClasses.overlay} flex items-center justify-center z-50`}>
        <div className={`${themeClasses.modal} rounded-xl shadow-2xl w-full max-w-md mx-4`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${themeClasses.header}`}>
            <h2 className="text-xl font-bold">Login Admin</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Admin
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border ${themeClasses.input} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  placeholder="admin@blackboxz.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border ${themeClasses.input} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                isLoading || !email || !password
                  ? themeClasses.buttonDisabled
                  : themeClasses.button
              }`}
            >
              {isLoading ? 'Memverifikasi...' : 'Login'}
            </button>

            {/* Demo Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Demo:</strong> Email: admin@blackboxz.com, Password: admin123
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Kiosk Setup Modal */}
      <KioskSetupModal 
        isOpen={showKioskSetup}
        onClose={handleKioskSetupClose}
        currentKioskCode={currentKioskCode}
        theme={theme}
      />
    </>
  );
}

export default AdminLoginModal;