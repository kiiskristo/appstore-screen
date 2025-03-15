import React from 'react';

function DeviceSettings({ 
  deviceType, 
  setDeviceType, 
  orientation, 
  setOrientation, 
  deviceDimensions,
  updatePreviewSetting
}) {
  const getSizeInfo = () => {
    const dimensions = deviceDimensions[deviceType][orientation];
    return `Size: ${dimensions.width} × ${dimensions.height}px`;
  };

  const handleOrientationChange = (newOrientation) => {
    setOrientation(newOrientation);
    updatePreviewSetting('orientation', newOrientation);
  };

  return (
    <div className="editor-section">
      <h3 className="editor-title">Device Settings</h3>
      
      <div className="mb-3">
        <label className="editor-label">
          Device Type
        </label>
        <select 
          className="editor-input"
          value={deviceType}
          onChange={(e) => setDeviceType(e.target.value)}
        >
          <option value="iphone">iPhone 6.7" or 6.9"</option>
          <option value="ipad">iPad 12.9" or 13"</option>
        </select>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{getSizeInfo()}</div>
      
      <label className="editor-label">Orientation</label>
      <div className="flex gap-4">
        <label className="inline-flex items-center">
          <input 
            type="radio" 
            className="form-radio text-blue-600 dark:text-blue-400"
            checked={orientation === 'portrait'} 
            onChange={() => handleOrientationChange('portrait')}
          />
          <span className="editor-checkbox-label">Portrait</span>
        </label>
        
        <label className="inline-flex items-center">
          <input 
            type="radio" 
            className="form-radio text-blue-600 dark:text-blue-400"
            checked={orientation === 'landscape'} 
            onChange={() => handleOrientationChange('landscape')}
          />
          <span className="editor-checkbox-label">Landscape</span>
        </label>
      </div>
    </div>
  );
}

export default DeviceSettings; 