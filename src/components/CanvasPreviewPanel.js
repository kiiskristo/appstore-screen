import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { detectDeviceFromDimensions, getFrameSource, deviceFrames } from '../assets/deviceFrameImages';

// This component only handles canvas rendering logic - no UI navigation
function CanvasPreviewPanelBase({
  deviceType,
  orientation,
  screenshots,
  currentScreenshotIndex,
  previewSettings,
  activePreviewIndex,
  deviceDimensions,
  onScaleChange,
  shouldUpdate,
  id
}, ref) {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(0.2);
  const [isExporting, setIsExporting] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // Use a callback for scale calculation to reuse in multiple places
  const calculateScale = useCallback(() => {
    if (deviceDimensions && deviceDimensions[deviceType] && deviceDimensions[deviceType][orientation]) {
      const { height } = deviceDimensions[deviceType][orientation];
      
      // Get viewport dimensions
      const viewportHeight = window.innerHeight;
      const containerHeight = viewportHeight * 0.75; // Use 60% of viewport height
      
      // Calculate scale based on available height
      const scaleFactor = containerHeight / height;
      
      // Add a maximum scale to prevent huge previews on large screens
      const maxScale = 0.55; // Maximum 35% of original size
      
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
  
  // Preload all frame images for better performance
  useEffect(() => {
    Object.values(deviceFrames).forEach(device => {
      Object.values(device.frames).forEach(frameSrc => {
        const preloadFrame = new Image();
        preloadFrame.src = frameSrc;
      });
    });
  }, []);
  
  // Only update when THIS specific preview's settings change
  const currentSettings = previewSettings[activePreviewIndex];
  
  // Use memo to cache the current settings object
  const memoizedSettings = useMemo(() => currentSettings, [
    currentSettings.rotation,
    currentSettings.scale,
    currentSettings.positionX,
    currentSettings.positionY,
    currentSettings.cornerRadius,
    currentSettings.showFrame,
    // Add other relevant properties
  ]);
  
  // Add this effect to detect when fonts are loaded
  useEffect(() => {
    // Simple check if document fonts API is available
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    } else {
      // Fallback for browsers without the fonts API
      // Give fonts some time to load
      setTimeout(() => setFontsLoaded(true), 500);
    }
  }, []);
  
  // Keep drawing the background, but skip the screenshot part if none is selected
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const currentScreenshot = currentScreenshotIndex !== null && 
                            currentScreenshotIndex !== undefined && 
                            screenshots[currentScreenshotIndex];
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
    
    // Create a function to render text
    const renderText = () => {
      if (!fontsLoaded || !currentSettings.showText) return;
      
      ctx.save();
      
      // Set text styles with proper font matching
      const titleFontSize = currentSettings.titleFontSize;
      const descriptionFontSize = currentSettings.descriptionFontSize;
      
      // Calculate text position
      let textX = canvas.width / (2 * dpr);
      let textY = canvas.height / (2 * dpr);
      
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
      const titleMaxWidth = canvas.width * 0.8 / dpr; // 80% of canvas width
      ctx.font = `${currentSettings.titleFontWeight} ${titleFontSize}px ${currentSettings.titleFontFamily}`;
      ctx.fillStyle = currentSettings.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const titleLines = wrapText(ctx, title, titleMaxWidth);
      let titleYOffset = textY - titleFontSize * (titleLines.length / 2);
      
      titleLines.forEach((line, index) => {
        ctx.fillText(line, textX, titleYOffset + (index * (titleFontSize * 1.2)));
      });
      
      // Draw description with wrapping
      ctx.font = `${currentSettings.descriptionFontWeight} ${descriptionFontSize}px ${currentSettings.descriptionFontFamily}`;
      const descMaxWidth = canvas.width * 0.8 / dpr; // 80% of canvas width
      const descLines = wrapText(ctx, description, descMaxWidth);
      
      // Start description below title with spacing
      let descYOffset = titleYOffset + (titleLines.length * (titleFontSize * 1.2)) + descriptionFontSize;
      
      descLines.forEach((line, index) => {
        ctx.fillText(line, textX, descYOffset + (index * (descriptionFontSize * 1.2)));
      });
      
      ctx.restore();
    };
    
    // Only try to render the screenshot if one exists
    if (currentScreenshot) {
      // Create a temporary image to work with
      const img = new Image();
      
      // CORS handling to prevent tainted canvas
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Calculate if screenshot is landscape
        const isLandscape = img.width > img.height;
        
        // Detect the device model from the screenshot dimensions
        const screenshotWidth = img.width;
        const screenshotHeight = img.height;
        const detectedDevice = detectDeviceFromDimensions(screenshotWidth, screenshotHeight);
        
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
        
        // Clear the canvas again to ensure no artifacts
        ctx.clearRect(0, 0, canvas.width/dpr, canvas.height/dpr);
        
        // Redraw the background
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
        
        // Always draw the screenshot
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.translate(
          (canvas.width * currentSettings.positionX) / (100 * dpr),
          (canvas.height * currentSettings.positionY) / (100 * dpr)
        );
        ctx.rotate((currentSettings.rotation * Math.PI) / 180);
        ctx.scale(currentSettings.scale / 100, currentSettings.scale / 100);
        
        // Create a second save point for the clipping operation
        ctx.save();
        
        // Scale the corner radius based on the canvas dimensions
        const scaleFactor = Math.min(canvas.width, canvas.height) / (1500 * dpr); // Baseline of 1500px
        const scaledCornerRadius = currentSettings.cornerRadius * scaleFactor;
        
        // Then use scaledCornerRadius instead of currentSettings.cornerRadius in the drawing code
        if (scaledCornerRadius > 0) {
          drawRoundedRect(ctx, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight, scaledCornerRadius);
          ctx.clip();
        }
        
        // Draw the screenshot with padding
        ctx.drawImage(
          img, 
          0, 0, 
          img.width, img.height,
          -drawWidth/2, -drawHeight/2, drawWidth, drawHeight
        );
        
        // Restore from the clipping context
        ctx.restore();
        
        // Finally restore the original context
        ctx.restore();
        
        // Conditionally load and draw the frame if enabled
        if (currentSettings.showFrame) {
          const frameImg = new Image();
          
          // Get frame source AFTER detecting the device from the screenshot 
          const frameSrc = getFrameSource(detectedDevice, currentSettings.frameColor || 'black');
          
          frameImg.src = frameSrc;
          
          frameImg.onload = () => {
            // THEN draw the frame on top if it's ready and enabled
            if (frameImg.complete && frameImg.naturalHeight !== 0) {
              ctx.save();
              ctx.translate(centerX, centerY);
              ctx.translate(
                (canvas.width * currentSettings.positionX) / (100 * dpr),
                (canvas.height * currentSettings.positionY) / (100 * dpr)
              );
              ctx.rotate((currentSettings.rotation * Math.PI) / 180);
              ctx.scale(currentSettings.scale / 100, currentSettings.scale / 100);
              
              // Calculate frame dimensions properly for both orientations
              let frameWidth, frameHeight;
              if (isLandscape) {
                // When the screenshot is landscape but our frame image is portrait
                ctx.rotate(Math.PI / 2); // 90 degrees
                frameWidth = drawHeight * 1.1;
                // Fix typo in original code (double assignment)
                frameHeight = frameWidth * (frameImg.height / frameImg.width);
              } else {
                // For portrait screenshots using portrait frames
                frameWidth = drawWidth * 1.1;
                frameHeight = frameWidth * (frameImg.height / frameImg.width);
              }
              
              // Draw frame slightly larger than the screenshot
              ctx.drawImage(frameImg, -frameWidth/2, -frameHeight/2, frameWidth, frameHeight);
              ctx.restore();
            }
            
            // Always render the text after everything else
            renderText();
          };
        } else {
          // If no frame, render text immediately
          renderText();
        }
      };
      
      img.src = currentScreenshot.src;
    } else {
      renderText(); // Render text for empty state
    }
  }, [
    activePreviewIndex, 
    previewSettings, 
    screenshots, 
    currentScreenshotIndex,
    deviceType,
    orientation,
    scale,
    deviceDimensions,
    fontsLoaded
  ]);

  const exportCanvas = () => {
    if (!canvasRef.current) return Promise.reject(new Error('Canvas not available'));
    
    return new Promise((resolve) => {
      setIsExporting(true);
      try {
        const link = document.createElement('a');
        link.download = `app-screenshot-${activePreviewIndex + 1}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
        
        setTimeout(() => {
          setIsExporting(false);
          resolve();
        }, 100);
      } catch (err) {
        console.error('Error exporting canvas:', err);
        setIsExporting(false);
        resolve(); // Resolve anyway to continue with other exports
      }
    });
  };

  // Export methods that can be called from outside
  React.useImperativeHandle(ref, () => ({
    exportCanvas
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

// First apply forwardRef, then apply memo
const CanvasPreviewPanel = React.memo(
  React.forwardRef(CanvasPreviewPanelBase),
  (prevProps, nextProps) => {
    // Only re-render when:
    // 1. This panel is the active one OR
    // 2. This panel's specific settings changed
    if (!nextProps.shouldUpdate && prevProps.shouldUpdate === nextProps.shouldUpdate) {
      return true; // don't re-render inactive panels unless they become active
    }
    
    // For active panel, check if relevant props changed
    if (prevProps.currentScreenshotIndex !== nextProps.currentScreenshotIndex) {
      return false; // re-render if screenshot changed
    }
    
    // Get this panel's specific settings
    const prevSettings = prevProps.previewSettings[prevProps.activePreviewIndex];
    const nextSettings = nextProps.previewSettings[nextProps.activePreviewIndex];
    
    // Deep compare only this panel's settings
    if (JSON.stringify(prevSettings) !== JSON.stringify(nextSettings)) {
      return false; // re-render if settings changed
    }
    
    // Don't re-render if nothing important changed
    return true;
  }
);

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

// Add this helper function to draw a rounded rectangle
const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  if (radius === 0) {
    ctx.rect(x, y, width, height);
    return;
  }
  
  // Limit radius to half the shorter side
  const limitedRadius = Math.min(radius, Math.min(width, height) / 2);
  
  ctx.beginPath();
  ctx.moveTo(x + limitedRadius, y);
  ctx.lineTo(x + width - limitedRadius, y);
  ctx.arcTo(x + width, y, x + width, y + limitedRadius, limitedRadius);
  ctx.lineTo(x + width, y + height - limitedRadius);
  ctx.arcTo(x + width, y + height, x + width - limitedRadius, y + height, limitedRadius);
  ctx.lineTo(x + limitedRadius, y + height);
  ctx.arcTo(x, y + height, x, y + height - limitedRadius, limitedRadius);
  ctx.lineTo(x, y + limitedRadius);
  ctx.arcTo(x, y, x + limitedRadius, y, limitedRadius);
  ctx.closePath();
};

// Export the memoized component instead
export default CanvasPreviewPanel; 