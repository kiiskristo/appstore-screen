import React, { useState, useEffect, useRef, useMemo } from 'react';
import CanvasPreviewPanel from './CanvasPreviewPanel';

function PreviewContainer({
  title = "Preview",
  deviceDimensions,
  deviceType,
  orientation,
  scale,
  previewSettings,
  activePreviewIndex,
  switchPreview,
  addPreview,
  removePreview,
  children,
  exportButtons,
  screenshots,
  currentScreenshotIndex
}) {
  const carouselRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [actualScale, setActualScale] = useState(0.2);
  
  // Completely simplified panel visibility logic
  const visiblePanels = useMemo(() => {
    let panels = [];
    
    // Simple rules:
    if (activePreviewIndex === 0) {
      // When on first preview, show first and second
      panels = [0, 1].filter(i => i < previewSettings.length);
    } else if (activePreviewIndex === previewSettings.length - 1) {
      // When on last preview, show last and previous
      panels = [activePreviewIndex - 1, activePreviewIndex];
    } else {
      // When on middle preview, show current and next
      panels = [activePreviewIndex, activePreviewIndex + 1];
    }
    
    console.log('Simple panels calculation:', panels, 'for activeIndex:', activePreviewIndex);
    return panels;
  }, [activePreviewIndex, previewSettings.length]);
  
  // Update carousel position based on total number of panels
  useEffect(() => {
    if (!carouselRef.current || previewSettings.length <= 1) return;
    
    setIsAnimating(true);
    
    // Calculate percentage dynamically based on total panel count
    const percentPerPanel = 100 / previewSettings.length;
    let position = -percentPerPanel * visiblePanels[0];
    
    console.log(`Panel calculation: ${percentPerPanel}% per panel with ${previewSettings.length} total panels`);
    console.log(`Setting position to ${position}% for panel: ${visiblePanels[0]}`);
    
    carouselRef.current.style.transform = `translateX(${position}%)`;
    
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [activePreviewIndex, previewSettings.length, visiblePanels]);

  // Wrapped version of switchPreview to add logging
  const handleSwitchPreview = (index) => {
    console.log('Switching to preview:', index, 'from:', activePreviewIndex);
    switchPreview(index);
  };

  return (
    <div className="flex-3 min-w-[500px] grow bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md flex flex-col items-center transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">{title}</h2>
      
      <div className="flex gap-2 mb-4">
        {previewSettings.map((_, index) => (
          <button 
            key={index}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${activePreviewIndex === index ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => handleSwitchPreview(index)}
          >
            {index + 1}
          </button>
        ))}
        
        {previewSettings.length < 6 && (
          <button 
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
            onClick={addPreview}
          >
            +
          </button>
        )}
        
        {previewSettings.length > 1 && (
          <button 
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
            onClick={removePreview}
          >
            -
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Size: {deviceDimensions[deviceType][orientation].width} × {deviceDimensions[deviceType][orientation].height}px
        {actualScale !== 1 && ` (Scaled ${Math.round(actualScale * 100)}% for display)`}
      </p>
      
      {previewSettings.length > 1 ? (
        <div className="w-full mb-4 overflow-hidden">
          <div
            ref={carouselRef}
            className={`flex w-full transition-transform ${isAnimating ? 'duration-300 ease-in-out' : ''}`}
            style={{ 
              width: `${previewSettings.length * 50}%`
            }}
          >
            {previewSettings.map((_, index) => (
              <div 
                key={`preview-${index}`}
                className={`w-1/2 px-2 transition-all duration-300
                           ${index === activePreviewIndex ? '' : 'opacity-70 hover:opacity-100 cursor-pointer'}
                           ${visiblePanels.includes(index) ? '' : 'opacity-0'}`}
                onClick={index !== activePreviewIndex ? () => handleSwitchPreview(index) : undefined}
              >
                <div className="relative flex items-center justify-center">
                  <CanvasPreviewPanel
                    id={`canvas-preview-${index}`}
                    deviceType={deviceType}
                    orientation={orientation}
                    screenshots={screenshots}
                    currentScreenshotIndex={currentScreenshotIndex}
                    previewSettings={previewSettings}
                    activePreviewIndex={index}
                    deviceDimensions={deviceDimensions}
                    switchPreview={switchPreview}
                    onScaleChange={index === activePreviewIndex ? setActualScale : undefined}
                    ref={index === activePreviewIndex ? node => window.activePreviewCanvas = node : undefined}
                  />
                  {index !== activePreviewIndex && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white bg-opacity-80 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4">
          {children}
        </div>
      )}
      
      {exportButtons}
    </div>
  );
}

export default PreviewContainer; 