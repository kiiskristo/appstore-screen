import React, { useRef } from 'react';

function ScreenshotUploader({ 
  screenshots, 
  setScreenshots, 
  currentScreenshotIndex, 
  setCurrentScreenshotIndex 
}) {
  const dropAreaRef = useRef(null);

  const handleFiles = (files) => {
    [...files].forEach(file => {
      if (file.type.match('image.*')) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          const img = new Image();
          const originalDataURL = e.target.result;
          img.src = originalDataURL;
          
          img.onload = function() {
            // Determine orientation from image dimensions
            const isLandscape = img.width > img.height;
            
            setScreenshots(prev => [
              ...prev,
              {
                src: originalDataURL,
                originalDataURL: originalDataURL,
                width: img.width,
                height: img.height,
                isLandscape: isLandscape
              }
            ]);
            
            if (currentScreenshotIndex === -1) {
              setCurrentScreenshotIndex(0);
            }
          };
        };
        
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.add('bg-blue-50', 'border-blue-500');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.remove('bg-blue-50', 'border-blue-500');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.remove('bg-blue-50', 'border-blue-500');
    }
    handleFiles(e.dataTransfer.files);
  };

  const selectScreenshot = (index) => {
    setCurrentScreenshotIndex(index);
  };

  return (
    <div className="editor-section">
      <h3 className="editor-title">Screenshots</h3>
      
      <div className="mb-4">
        <label className="editor-label">Upload Screenshot</label>
        <input 
          type="file" 
          className="editor-input"
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>
      
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 mt-2 transition-colors"
        ref={dropAreaRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        Or drag and drop images here
      </div>
      
      {screenshots.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Available Screenshots
          </h4>
          <div className="screenshot-grid">
            {screenshots.map((screenshot, index) => (
              <div 
                key={index}
                className={`screenshot-thumbnail relative overflow-hidden rounded-md border-2 transition-all ${
                  currentScreenshotIndex === index 
                    ? 'border-blue-500 shadow-md' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                onClick={() => selectScreenshot(index)}
              >
                <img 
                  src={screenshot.src} 
                  alt={`Screenshot ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <div className="screenshot-info absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span>{`Screenshot ${index + 1}`}</span>
                    <small>{screenshot.width}×{screenshot.height}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScreenshotUploader; 