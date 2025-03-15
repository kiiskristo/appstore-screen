import React from 'react';

function DeviceFrameSettings({ 
  showFrame, 
  frameColor, 
  updatePreviewSetting 
}) {
  return (
    <div className="editor-section">
      <h3 className="editor-title">Device Frame</h3>
      
      <div className="mb-4">
        <label className="flex items-center">
          <input 
            type="checkbox" 
            className="form-checkbox"
            checked={showFrame} 
            onChange={(e) => updatePreviewSetting('showFrame', e.target.checked)} 
          />
          <span className="editor-checkbox-label">Show Device Frame</span>
        </label>
      </div>
      
      {showFrame && (
        <div className="mb-3">
          <label className="editor-label">Frame Color</label>
          <select 
            className="editor-input"
            value={frameColor} 
            onChange={(e) => updatePreviewSetting('frameColor', e.target.value)}
          >
            <option value="black">Black</option>
            <option value="white">White</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
          </select>
        </div>
      )}
    </div>
  );
}

export default DeviceFrameSettings; 