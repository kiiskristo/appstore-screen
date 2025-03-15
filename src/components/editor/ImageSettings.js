import React from 'react';

function ImageSettings({ 
  rotation, 
  scale, 
  positionX, 
  positionY, 
  updatePreviewSetting 
}) {
  return (
    <div className="editor-section">
      <h3 className="editor-title">Image Adjustments</h3>
      
      <div className="mb-3">
        <label className="editor-label">Rotation: {rotation}°</label>
        <input 
          type="range" 
          className="editor-range"
          min="-180" 
          max="180" 
          value={rotation} 
          onChange={(e) => updatePreviewSetting('rotation', parseInt(e.target.value))} 
        />
      </div>
      
      <div className="mb-3">
        <label className="editor-label">Scale: {scale}%</label>
        <input 
          type="range" 
          className="editor-range"
          min="50" 
          max="150" 
          value={scale} 
          onChange={(e) => updatePreviewSetting('scale', parseInt(e.target.value))} 
        />
      </div>
      
      <div className="mb-3">
        <label className="editor-label">Position X: {positionX}</label>
        <input 
          type="range" 
          className="editor-range"
          min="-50" 
          max="50" 
          value={positionX} 
          onChange={(e) => updatePreviewSetting('positionX', parseInt(e.target.value))} 
        />
      </div>
      
      <div className="mb-3">
        <label className="editor-label">Position Y: {positionY}</label>
        <input 
          type="range" 
          className="editor-range"
          min="-50" 
          max="50" 
          value={positionY} 
          onChange={(e) => updatePreviewSetting('positionY', parseInt(e.target.value))} 
        />
      </div>
    </div>
  );
}

export default ImageSettings; 