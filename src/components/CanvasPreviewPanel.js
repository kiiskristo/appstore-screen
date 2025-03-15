import React, { useRef, useEffect, useState, useCallback } from 'react';
import iPhoneFramePortrait from '../assets/frames/iPhone 16 - Black - Portrait.png';

// This component only handles canvas rendering logic - no UI navigation
function CanvasPreviewPanel({
  deviceType,
  orientation,
  screenshots,
  currentScreenshotIndex,
  previewSettings,
  activePreviewIndex,
  deviceDimensions,
  switchPreview,
  onScaleChange,
  id
}, ref) {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(0.2);
  const [isExporting, setIsExporting] = useState(false);
  
  // Use a callback for scale calculation to reuse in multiple places
  const calculateScale = useCallback(() => {
    if (deviceDimensions && deviceDimensions[deviceType] && deviceDimensions[deviceType][orientation]) {
      const { height } = deviceDimensions[deviceType][orientation];
      
      // Get viewport dimensions
      const viewportHeight = window.innerHeight;
      const containerHeight = viewportHeight * 0.6; // Use 60% of viewport height
      
      // Calculate scale based on available height
      const scaleFactor = containerHeight / height;
      
      // Add a maximum scale to prevent huge previews on large screens
      const maxScale = 0.35; // Maximum 35% of original size
      
      return Math.min(scaleFactor, maxScale);
    }
    return 0.2; // Default fallback
  }, [deviceDimensions, deviceType, orientation]);
  
  // Update scale and notify parent when scale changes
  useEffect(() => {
    const newScale = calculateScale();
    setScale(newScale);
    
    // Notify parent component of scale change
    if (onScaleChange) {
      onScaleChange(newScale);
    }
  }, [deviceType, orientation, deviceDimensions, calculateScale, onScaleChange]);
  
  // Add window resize listener to update scale when window size changes
  useEffect(() => {
    const handleResize = () => {
      setScale(calculateScale());
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial calculation
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateScale]);
  
  // Preload frame image
  useEffect(() => {
    const preloadFrame = new Image();
    preloadFrame.src = iPhoneFramePortrait;
  }, []);
  
  // Render the preview to canvas 
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentSettings = previewSettings[activePreviewIndex];
    const screenshot = screenshots[currentScreenshotIndex];
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Skip if no screenshot
    if (!screenshot) return;
    
    // Get device dimensions
    const { width: deviceWidth, height: deviceHeight } = deviceDimensions[deviceType][orientation];
    
    // Set high resolution canvas for better quality
    // Get the device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    
    // Set the canvas size with higher resolution for better quality
    canvas.width = deviceWidth * scale * dpr;
    canvas.height = deviceHeight * scale * dpr;
    
    // Scale canvas for higher pixel density
    ctx.scale(dpr, dpr);
    
    // Adjust the canvas CSS size to match the desired display size
    canvas.style.width = `${deviceWidth * scale}px`;
    canvas.style.height = `${deviceHeight * scale}px`;
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw the background
    if (currentSettings.useGradient) {
      const gradient = currentSettings.gradientDirection === 'circle' 
        ? ctx.createRadialGradient(canvas.width/(2*dpr), canvas.height/(2*dpr), 0, canvas.width/(2*dpr), canvas.height/(2*dpr), canvas.width/(2*dpr))
        : createLinearGradient(ctx, currentSettings.gradientDirection, canvas.width/dpr, canvas.height/dpr);
      
      gradient.addColorStop(0, currentSettings.gradientColor1);
      gradient.addColorStop(1, currentSettings.gradientColor2);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = 'white';
    }
    ctx.fillRect(0, 0, canvas.width/dpr, canvas.height/dpr);
    
    // Create a temporary image to work with
    const img = new Image();
    
    // CORS handling to prevent tainted canvas
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Calculate if screenshot is landscape
      const isLandscape = img.width > img.height;
      
      // Calculate the center position
      const centerX = canvas.width / (2 * dpr);
      const centerY = canvas.height / (2 * dpr);
      
      // Calculate size based on orientation
      let drawWidth, drawHeight;
      const baseSize = canvas.width / (dpr * 1.33); // 75% of canvas width
      
      if (isLandscape) {
        drawWidth = baseSize;
        drawHeight = baseSize * (img.height / img.width);
      } else {
        drawHeight = baseSize;
        drawWidth = baseSize * (img.width / img.height);
      }
      
      // Apply user transformations
      ctx.save();
      
      // Translate to center, then apply transformations, then draw
      ctx.translate(centerX, centerY);
      ctx.translate(
        (canvas.width * currentSettings.positionX) / (100 * dpr),
        (canvas.height * currentSettings.positionY) / (100 * dpr)
      );
      ctx.rotate((currentSettings.rotation * Math.PI) / 180);
      ctx.scale(currentSettings.scale / 100, currentSettings.scale / 100);
      
      // Draw screenshot with rounded corners
      if (currentSettings.showFrame) {
        roundedImage(ctx, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight, 20);
      } else {
        roundedImage(ctx, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight, 10);
      }
      ctx.clip();
      
      // Use better drawing method for crisp image
      ctx.drawImage(img, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
      ctx.restore();
      
      // Draw device frame if enabled
      if (currentSettings.showFrame) {
        const frameImg = new Image();
        console.log('Loading frame:', iPhoneFramePortrait);
        
        frameImg.onload = () => {
          console.log('Frame loaded successfully');
          
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.translate(
            (canvas.width * currentSettings.positionX) / (100 * dpr),
            (canvas.height * currentSettings.positionY) / (100 * dpr)
          );
          ctx.rotate((currentSettings.rotation * Math.PI) / 180);
          ctx.scale(currentSettings.scale / 100, currentSettings.scale / 100);
          
          // If screenshot is landscape, swap width and height for the frame
          let frameWidth, frameHeight;
          if (isLandscape) {
            // When rotated 90 degrees, we need to swap width/height
            frameWidth = drawHeight;
            frameHeight = drawWidth;
            
            // Rotate frame
            ctx.rotate(Math.PI / 2); // 90 degrees
          } else {
            frameWidth = drawWidth;
            frameHeight = drawHeight;
          }
          
          // Draw frame exactly over the screenshot
          ctx.drawImage(frameImg, -frameWidth/2, -frameHeight/2, frameWidth, frameHeight);
          ctx.restore();
        };
        
        frameImg.onerror = (e) => {
          console.error('Error loading frame:', e);
        };
        
        frameImg.src = iPhoneFramePortrait;
      }
      
      // Draw text if enabled
      if (currentSettings.showText) {
        ctx.save();
        
        // Set text styles with proper font matching
        const titleFontSize = currentSettings.titleFontSize;
        const descriptionFontSize = currentSettings.descriptionFontSize;
        
        // Calculate text position
        let textX = centerX;
        let textY = centerY;
        
        // Position based on settings
        switch (currentSettings.textPosition) {
          case 'top':
            textY = canvas.height * 0.15 / dpr;
            break;
          case 'bottom':
            textY = canvas.height * 0.85 / dpr;
            break;
          case 'custom':
            textX = canvas.width * (currentSettings.textPositionX / 100) / dpr;
            textY = canvas.height * (currentSettings.textPositionY / 100) / dpr;
            break;
          default:
            break;
        }
        
        // Get text content
        const title = currentSettings.textTitle || '';
        const description = currentSettings.textDescription || '';
        
        // Add text shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Draw title with wrapping
        ctx.font = `${titleFontSize}px ${currentSettings.titleFontFamily}`;
        ctx.fillStyle = currentSettings.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Wrap and draw title
        const titleMaxWidth = canvas.width * 0.8 / dpr; // 80% of canvas width
        const titleLines = wrapText(ctx, title, titleMaxWidth);
        let titleYOffset = textY - titleFontSize * (titleLines.length / 2);
        
        titleLines.forEach((line, index) => {
          ctx.fillText(line, textX, titleYOffset + (index * (titleFontSize * 1.2)));
        });
        
        // Draw description with wrapping
        ctx.font = `${descriptionFontSize}px ${currentSettings.descriptionFontFamily}`;
        const descMaxWidth = canvas.width * 0.8 / dpr; // 80% of canvas width
        const descLines = wrapText(ctx, description, descMaxWidth);
        
        // Start description below title with spacing
        let descYOffset = titleYOffset + (titleLines.length * (titleFontSize * 1.2)) + descriptionFontSize;
        
        descLines.forEach((line, index) => {
          ctx.fillText(line, textX, descYOffset + (index * (descriptionFontSize * 1.2)));
        });
        
        ctx.restore();
      }
    };
    img.src = screenshot.src;
  }, [
    activePreviewIndex, 
    previewSettings, 
    screenshots, 
    currentScreenshotIndex,
    deviceType,
    orientation,
    scale,
    deviceDimensions
  ]);

  const exportCanvas = () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      const link = document.createElement('a');
      link.download = `app-screenshot-${activePreviewIndex + 1}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error exporting canvas:', err);
    }
    setIsExporting(false);
  };

  const exportAllScreenshots = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    
    for (let i = 0; i < previewSettings.length; i++) {
      // Switch to the preview, give render cycle time to complete
      switchPreview(i);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Export the canvas
      const link = document.createElement('a');
      link.download = `app-screenshot-${i + 1}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
      
      // Give a bit more time before the next export
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsExporting(false);
  };

  // Export methods that can be called from outside
  // Now expose these methods to the parent through the ref
  React.useImperativeHandle(ref, () => ({
    exportCanvas,
    exportAllScreenshots
  }));

  return (
    <>
      <canvas 
        id={id} 
        ref={canvasRef}
        className="rounded-lg"
      />
      {isExporting && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <p>Exporting...</p>
        </div>
      )}
    </>
  );
}

// Helper function to draw a rounded rectangle
function roundedImage(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper function to create a linear gradient based on direction
function createLinearGradient(ctx, direction, width, height) {
  switch (direction) {
    case 'to right':
      return ctx.createLinearGradient(0, 0, width, 0);
    case 'to bottom':
      return ctx.createLinearGradient(0, 0, 0, height);
    case 'to bottom right':
      return ctx.createLinearGradient(0, 0, width, height);
    case 'to bottom left':
      return ctx.createLinearGradient(width, 0, 0, height);
    default:
      return ctx.createLinearGradient(0, 0, 0, height);
  }
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  lines.push(currentLine); // Push the last line
  return lines;
}

export default React.forwardRef(CanvasPreviewPanel); 