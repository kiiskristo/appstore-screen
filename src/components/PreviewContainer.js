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
  currentScreenshotIndex,
  darkMode
}) {
  const carouselRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [actualScale, setActualScale] = useState(0.2);
  
  // Completely simplified panel visibility logic
  const visiblePanels = useMemo(() => {
    let panels = [];
    
    // Show 3 panels at a time with more context
    if (activePreviewIndex === 0) {
      // When on first preview, show first three
      panels = [0, 1, 2].filter(i => i < previewSettings.length);
    } else if (activePreviewIndex === previewSettings.length - 1) {
      // When on last preview, show last three if possible
      panels = [
        Math.max(0, activePreviewIndex - 2), 
        Math.max(0, activePreviewIndex - 1), 
        activePreviewIndex
      ];
    } else {
      // When on middle preview, show previous, current, and next
      panels = [activePreviewIndex - 1, activePreviewIndex, activePreviewIndex + 1];
    }
    
    return panels;
  }, [activePreviewIndex, previewSettings.length]);
  
  // Update carousel position based on total number of panels
  useEffect(() => {
    if (!carouselRef.current || previewSettings.length <= 1) return;
    
    setIsAnimating(true);
    
    // Calculate percentage for 3-panel view
    const percentPerPanel = 100 / previewSettings.length;
    
    // Adjust position calculation to ensure the active panel is centered
    // when possible, or aligned properly at the beginning/end
    let position;
    
    if (activePreviewIndex === 0) {
      // First panel should be at the start
      position = 0;
    } else if (activePreviewIndex >= previewSettings.length - 2) {
      // Last 2 panels should show the end of the carousel
      position = -percentPerPanel * (previewSettings.length - 3);
    } else {
      // Center the active panel
      position = -percentPerPanel * (activePreviewIndex - 1);
    }
    
    // Ensure position is never positive and never hides all panels
    position = Math.min(0, Math.max(position, -percentPerPanel * (previewSettings.length - 3)));
    
    carouselRef.current.style.transform = `translateX(${position}%)`;
    
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [activePreviewIndex, previewSettings.length]);

  // Wrapped version of switchPreview to add logging
  const handleSwitchPreview = (index) => {
    switchPreview(index);
  };

  // Calculate the display scale based on screen width and device dimensions
  const calculateScale = () => {
    const maxWidth = window.innerHeight * 0.7; // Half the screen width
    const deviceWidth = deviceDimensions[deviceType][orientation].width;
    const scaleToFit = maxWidth / deviceWidth;
    return Math.min(scaleToFit, scale); // Use the smaller of our two scales
  };
  
  // Update actualScale when relevant props change
  useEffect(() => {
    setActualScale(calculateScale());
    
    // Also update on window resize
    const handleResize = () => {
      setActualScale(calculateScale());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [deviceType, orientation, scale, deviceDimensions, calculateScale]);

  // Get device name for display
  const deviceName = deviceType === 'iphone' ? 'iPhone' : 'iPad';
  
  return (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
      {/* Compact header with row layout */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{deviceName} • {orientation}</h3>
          
          {/* Preview tabs in the same row as the title */}
          <div className="preview-tabs flex gap-1 ml-4">
            {previewSettings.map((_, index) => (
              <button
                key={index}
                className={`px-2 py-1 text-xs rounded ${
                  activePreviewIndex === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                }`}
                onClick={() => handleSwitchPreview(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="flex">
            <button
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              onClick={addPreview}
              title="Add preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              onClick={removePreview}
              title="Remove preview"
              disabled={previewSettings.length <= 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Controls moved to the right side */}
        <div className="flex items-center gap-2">          
          {/* Export buttons as a dropdown to save space */}
          <div className="relative group">
            <button className="bg-blue-600 text-white py-1 px-3 text-sm rounded-lg hover:bg-blue-700 transition-colors">
              Export Options ▾
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 hidden group-hover:block z-10">
              <div className="flex flex-col gap-2">
                {exportButtons}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content area with more vertical space */}
      <div className="flex-1 overflow-hidden flex items-center justify-center">
        {previewSettings.length > 1 ? (
          <div className="w-full h-full overflow-hidden">
            <div
              ref={carouselRef}
              className={`flex w-full h-full transition-transform ${isAnimating ? 'duration-300 ease-in-out' : ''}`}
              style={{ 
                width: `${previewSettings.length * 33.33}%` // Each panel is 1/3 of viewport
              }}
            >
              {previewSettings.map((settings, index) => (
                <div 
                  key={`preview-${index}`}
                  className={`w-1/3 h-full px-2 transition-all duration-300
                             ${index === activePreviewIndex ? '' : 'opacity-80 hover:opacity-100 cursor-pointer'}
                             ${visiblePanels.includes(index) ? '' : 'opacity-0'}`}
                  onClick={index !== activePreviewIndex ? () => handleSwitchPreview(index) : undefined}
                >
                  <div className="relative flex items-center justify-center h-full">
                    <CanvasPreviewPanel
                      id={`canvas-preview-${index}`}
                      key={`canvas-${index}`}
                      deviceType={deviceType}
                      orientation={orientation}
                      screenshots={screenshots}
                      currentScreenshotIndex={settings.screenshotIndex ?? -1}
                      previewSettings={previewSettings}
                      activePreviewIndex={index}
                      deviceDimensions={deviceDimensions}
                      shouldUpdate={index === activePreviewIndex}
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
          <div className="h-full flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewContainer; 