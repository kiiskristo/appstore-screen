import React from 'react';

function BackgroundSettings({ 
  useGradient, 
  gradientDirection, 
  gradientColor1, 
  gradientColor2, 
  updatePreviewSetting 
}) {
  const gradientPresets = [
    { colors: ['#4a6bff', '#45caff'], direction: 'to right' },
    { colors: ['#ff6b6b', '#ffa26b'], direction: 'to right' },
    { colors: ['#00b09b', '#96c93d'], direction: 'to right' },
    { colors: ['#614385', '#516395'], direction: 'to right' },
    { colors: ['#8e2de2', '#4a00e0'], direction: 'to right' },
    { colors: ['#f953c6', '#b91d73'], direction: 'to right' }
  ];

  const handleGradientPresetClick = (preset) => {
    updatePreviewSetting('gradientColor1', preset.colors[0]);
    updatePreviewSetting('gradientColor2', preset.colors[1]);
    updatePreviewSetting('gradientDirection', preset.direction);
  };

  return (
    <div className="editor-section">
      <h3 className="editor-title">Background</h3>
      
      <div className="mb-4">
        <label className="flex items-center">
          <input 
            type="checkbox" 
            className="form-checkbox"
            checked={useGradient} 
            onChange={(e) => updatePreviewSetting('useGradient', e.target.checked)} 
          />
          <span className="editor-checkbox-label">Use Gradient Background</span>
        </label>
      </div>
      
      {useGradient && (
        <>
          <div className="mb-3">
            <label className="editor-label">Gradient Direction</label>
            <select 
              className="editor-input"
              value={gradientDirection} 
              onChange={(e) => updatePreviewSetting('gradientDirection', e.target.value)}
            >
              <option value="to right">Horizontal</option>
              <option value="to bottom">Vertical</option>
              <option value="to bottom right">Diagonal ↘</option>
              <option value="to bottom left">Diagonal ↙</option>
              <option value="circle">Radial</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label className="editor-label">Gradient Presets</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {gradientPresets.map((preset, index) => (
                <button 
                  key={index}
                  className="w-16 h-10 rounded-md cursor-pointer hover:scale-105 transition-transform border border-gray-300 dark:border-gray-600"
                  style={{
                    background: `linear-gradient(${preset.direction}, ${preset.colors[0]}, ${preset.colors[1]})`
                  }}
                  onClick={() => handleGradientPresetClick(preset)}
                  aria-label={`Gradient preset ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-3">
            <label className="editor-label">Color 1</label>
            <input 
              type="color" 
              className="editor-color-picker"
              value={gradientColor1} 
              onChange={(e) => updatePreviewSetting('gradientColor1', e.target.value)} 
            />
          </div>
          
          <div className="mb-3">
            <label className="editor-label">Color 2</label>
            <input 
              type="color" 
              className="editor-color-picker"
              value={gradientColor2} 
              onChange={(e) => updatePreviewSetting('gradientColor2', e.target.value)} 
            />
          </div>
        </>
      )}
    </div>
  );
}

export default BackgroundSettings; 