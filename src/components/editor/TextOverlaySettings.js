import React from 'react';

function TextOverlaySettings({ 
  showText, 
  textTitle, 
  textDescription, 
  titleFontSize, 
  titleFontFamily, 
  descriptionFontSize, 
  descriptionFontFamily, 
  textColor, 
  textPosition, 
  textPositionX, 
  textPositionY, 
  updatePreviewSetting 
}) {
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
          <div className="mb-3">
            <label className="editor-label">Text Position</label>
            <select 
              className="editor-input"
              value={textPosition} 
              onChange={(e) => updatePreviewSetting('textPosition', e.target.value)}
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          {textPosition === 'custom' && (
            <>
              <div className="mb-3">
                <label className="editor-label">Position X: {textPositionX}</label>
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
                <label className="editor-label">Position Y: {textPositionY}</label>
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
        </>
      )}
    </div>
  );
}

export default TextOverlaySettings; 