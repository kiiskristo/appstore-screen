import React from 'react';

function TextOverlaySettings({ 
  showText, 
  textTitle, 
  textDescription, 
  titleFontSize, 
  titleFontFamily, 
  titleFontWeight,
  descriptionFontSize, 
  descriptionFontFamily, 
  descriptionFontWeight,
  textColor, 
  textPosition, 
  textPositionX, 
  textPositionY,
  descriptionPosition,
  descriptionPositionX,
  descriptionPositionY,
  updatePreviewSetting 
}) {
  // Add this font list to your TextOverlaySettings component
  const fontFamilies = [
    // All Round Gothic (primary font)
    { value: "'all-round-gothic', sans-serif", label: "All Round Gothic" },
    
    // Sans-serif fonts (clean, modern)
    { value: "'Segoe UI', sans-serif", label: "Segoe UI" },
    { value: "'Helvetica Neue', Helvetica, Arial, sans-serif", label: "Helvetica Neue" },
    { value: "'SF Pro Display', sans-serif", label: "SF Pro Display" },
    { value: "'Roboto', sans-serif", label: "Roboto" },
    { value: "'Montserrat', sans-serif", label: "Montserrat" },
    { value: "'Open Sans', sans-serif", label: "Open Sans" },
    { value: "'Poppins', sans-serif", label: "Poppins" },
    
    // Serif fonts (traditional, professional)
    { value: "'Georgia', serif", label: "Georgia" },
    { value: "'Playfair Display', serif", label: "Playfair Display" },
    { value: "'Merriweather', serif", label: "Merriweather" },
    
    // Display fonts (stylish, unique)
    { value: "'Bebas Neue', cursive", label: "Bebas Neue" },
    { value: "'Pacifico', cursive", label: "Pacifico" },
    
    // Monospace (technical, code-like)
    { value: "'JetBrains Mono', monospace", label: "JetBrains Mono" },
    { value: "'Fira Code', monospace", label: "Fira Code" }
  ];

  // Add this array for font weight options below your fontFamilies array
  const fontWeights = [
    { value: '100', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Bold' },
    { value: '600', label: 'Demi Bold' },
    { value: '700', label: 'Extra Bold' },
  ];

  return (
    <div className="editor-section">
      <h3 className="editor-title">Text Overlay</h3>
      
      <div className="mb-4">
        <label className="flex items-center">
          <input 
            type="checkbox" 
            className="form-checkbox"
            checked={showText} 
            onChange={(e) => updatePreviewSetting('showText', e.target.checked)} 
          />
          <span className="editor-checkbox-label">Show Text Overlay</span>
        </label>
      </div>
      
      {showText && (
        <>
          {/* Title Settings */}
          <div className="mb-3">
            <label className="editor-label">Title</label>
            <input 
              type="text" 
              className="editor-input"
              value={textTitle} 
              onChange={(e) => updatePreviewSetting('textTitle', e.target.value)} 
            />
          </div>
          
          <div className="mb-3">
            <label className="editor-label">Title Font Size: {titleFontSize}px</label>
            <input 
              type="range" 
              className="editor-range"
              min="16" 
              max="48" 
              value={titleFontSize} 
              onChange={(e) => updatePreviewSetting('titleFontSize', parseInt(e.target.value))} 
            />
          </div>
          
          {/* Font Family Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Title Font
            </label>
            <select
              value={titleFontFamily || "'Segoe UI', sans-serif"}
              onChange={(e) => updatePreviewSetting('titleFontFamily', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white"
            >
              {fontFamilies.map((font) => (
                <option key={font.label} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Title Font Weight */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Title Weight
            </label>
            <select
              value={titleFontWeight || '700'}
              onChange={(e) => updatePreviewSetting('titleFontWeight', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white"
            >
              {fontWeights.map((weight) => (
                <option 
                  key={weight.value} 
                  value={weight.value}
                >
                  {weight.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Description Settings */}
          <div className="mb-3">
            <label className="editor-label">Description</label>
            <textarea 
              className="editor-input"
              value={textDescription} 
              onChange={(e) => updatePreviewSetting('textDescription', e.target.value)} 
              rows="2"
            ></textarea>
          </div>
          
          <div className="mb-3">
            <label className="editor-label">Description Font Size: {descriptionFontSize}px</label>
            <input 
              type="range" 
              className="editor-range"
              min="12" 
              max="32" 
              value={descriptionFontSize} 
              onChange={(e) => updatePreviewSetting('descriptionFontSize', parseInt(e.target.value))} 
            />
          </div>
          
          {/* Description Font Family */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description Font
            </label>
            <select
              value={descriptionFontFamily || "'Segoe UI', sans-serif"}
              onChange={(e) => updatePreviewSetting('descriptionFontFamily', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white"
            >
              {fontFamilies.map((font) => (
                <option key={font.label} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Description Font Weight */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description Weight
            </label>
            <select
              value={descriptionFontWeight || '400'}
              onChange={(e) => updatePreviewSetting('descriptionFontWeight', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white"
            >
              {fontWeights.map((weight) => (
                <option 
                  key={weight.value} 
                  value={weight.value}
                >
                  {weight.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Text Color */}
          <div className="mb-3">
            <label className="editor-label">Text Color</label>
            <input 
              type="color" 
              className="editor-color-picker"
              value={textColor} 
              onChange={(e) => updatePreviewSetting('textColor', e.target.value)} 
            />
          </div>
          
          {/* Position Settings */}
          <h3 className="editor-label">Title Position</h3>
          <div className="mb-3">
            <select
              className="editor-input"
              value={textPosition}
              onChange={(e) => updatePreviewSetting('textPosition', e.target.value)}
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          {textPosition === 'custom' && (
            <>
              <div className="mb-3">
                <label className="editor-label">Title X Position: {textPositionX}%</label>
                <input
                  type="range"
                  className="editor-range"
                  min="0"
                  max="100"
                  value={textPositionX}
                  onChange={(e) => updatePreviewSetting('textPositionX', parseInt(e.target.value))}
                />
              </div>
              <div className="mb-3">
                <label className="editor-label">Title Y Position: {textPositionY}%</label>
                <input
                  type="range"
                  className="editor-range"
                  min="0"
                  max="100"
                  value={textPositionY}
                  onChange={(e) => updatePreviewSetting('textPositionY', parseInt(e.target.value))}
                />
              </div>
            </>
          )}
          
          <h3 className="editor-label">Description Position</h3>
          <div className="mb-3">
            <select
              className="editor-input"
              value={descriptionPosition || 'below'}
              onChange={(e) => updatePreviewSetting('descriptionPosition', e.target.value)}
            >
              <option value="below">Below Title</option>
              <option value="custom">Custom Position</option>
            </select>
          </div>
          
          {(descriptionPosition === 'custom') && (
            <>
              <div className="mb-3">
                <label className="editor-label">Description X: {descriptionPositionX}%</label>
                <input
                  type="range"
                  className="editor-range"
                  min="0"
                  max="100"
                  value={descriptionPositionX || 50}
                  onChange={(e) => updatePreviewSetting('descriptionPositionX', parseInt(e.target.value))}
                />
              </div>
              <div className="mb-3">
                <label className="editor-label">Description Y: {descriptionPositionY}%</label>
                <input
                  type="range"
                  className="editor-range"
                  min="0"
                  max="100"
                  value={descriptionPositionY || 60}
                  onChange={(e) => updatePreviewSetting('descriptionPositionY', parseInt(e.target.value))}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default TextOverlaySettings; 