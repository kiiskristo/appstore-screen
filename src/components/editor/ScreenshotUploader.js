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
          img.src = e.target.result;
          
          img.onload = function() {
            // Determine orientation from image dimensions
            const isLandscape = img.width > img.height;
            
            setScreenshots(prev => [
              ...prev,
              {
                src: e.target.result,
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
        <div>
          <label className="editor-label">Available Screenshots</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {screenshots.map((screenshot, index) => (
              <div 
                key={index}
                className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 ${currentScreenshotIndex === index ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => selectScreenshot(index)}
              >
                <img 
                  src={screenshot.src} 
                  alt={`Screenshot ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScreenshotUploader; 