function InputDisplay({ 
  value = "", 
  placeholder = "------", 
  maxLength = 20, // Increase default maxLength
  label = "Input",
  className = "",
  theme = "blackboxz"
}) {
  
  const getThemeClasses = () => {
    if (theme === 'blackboxz') {
      return {
        container: 'bg-white border-2 border-blackboxz-primary/20 shadow-lg',
        text: 'text-blackboxz-dark',
        counter: 'text-blackboxz-primary'
      };
    }
    
    if (theme === 'light') {
      return {
        container: 'bg-gray-50 border-2 border-gray-200',
        text: 'text-gray-800',
        counter: 'text-gray-500'
      };
    }
    
    if (theme === 'dark') {
      return {
        container: 'bg-gray-800 border-2 border-gray-600',
        text: 'text-white',
        counter: 'text-gray-300'
      };
    }
    
    // Default fallback
    return {
      container: 'bg-gray-50 border-2 border-gray-200',
      text: 'text-gray-800',
      counter: 'text-gray-500'
    };
  };

  const themeClasses = getThemeClasses();
  const displayValue = value || placeholder;

  return (
    <div className={`${className}`}>
      <div className={`${themeClasses.container} rounded-xl p-6 mb-4`}>
        <div className="text-center">
          <div className={`text-3xl font-mono font-bold ${themeClasses.text} tracking-widest min-h-[3rem] flex items-center justify-center`}>
            {displayValue}
          </div>
          <div className={`text-sm ${themeClasses.counter} font-medium mt-2`}>
            {value.length} karakter
          </div>
        </div>
      </div>
    </div>
  );
}

export default InputDisplay;