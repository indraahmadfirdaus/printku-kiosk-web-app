import React from 'react';

const VirtualKeyboard = ({ 
  onKeyPress, 
  theme = 'blackboxz', 
  keySize = 'h-12 w-12', 
  className = '' 
}) => {
  // QWERTY keyboard layout
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  ];

  // Theme-based styling
  const getThemeStyles = () => {
    switch (theme) {
      case 'blackboxz':
        return {
          keyButton: 'bg-white border-2 border-blackboxz-primary/20 text-blackboxz-dark hover:bg-blackboxz-primary hover:text-white active:bg-blackboxz-secondary',
          specialButton: 'bg-blackboxz-secondary text-white hover:bg-blackboxz-primary active:bg-blackboxz-dark'
        };
      default:
        return {
          keyButton: 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-blue-500 hover:text-white active:bg-blue-600',
          specialButton: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
        };
    }
  };

  const themeStyles = getThemeStyles();

  const handleKeyClick = (key) => {
    if (onKeyPress) {
      onKeyPress(key);
    }
  };

  return (
    <div className={`select-none ${className}`}>
      {/* Main keyboard rows */}
      <div className="space-y-2 mb-4">
        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyClick(key)}
                className={`
                  ${keySize} rounded-lg font-semibold text-lg transition-all duration-150 
                  shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95
                  ${themeStyles.keyButton}
                `}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Action buttons row */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleKeyClick('DELETE')}
          className={`
            px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-150 
            shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95
            ${themeStyles.specialButton}
          `}
        >
          DELETE
        </button>
        <button
          onClick={() => handleKeyClick('CLEAR')}
          className={`
            px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-150 
            shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95
            ${themeStyles.specialButton}
          `}
        >
          CLEAR
        </button>
      </div>
    </div>
  );
};

export default VirtualKeyboard;