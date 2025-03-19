// Helper function to create a linear gradient based on direction
export function createLinearGradient(ctx, direction, width, height) {
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

// Helper function to wrap text
export function wrapText(ctx, text, maxWidth) {
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

// Helper function to draw a rounded rectangle
export function drawRoundedRect(ctx, x, y, width, height, radius) {
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
}

// Main export canvas function
export async function renderExportCanvas({
  deviceType,
  orientation,
  screenshots,
  currentScreenshotIndex,
  currentSettings,
  deviceDimensions,
  fontsLoaded,
  activePreviewIndex,
  detectDeviceFromDimensions,
  getFrameSource
}) {
  // Get the full dimensions for the device type
  const { width: fullWidth, height: fullHeight } = deviceDimensions[deviceType][orientation];
  
  // Create a temporary canvas at full resolution
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = fullWidth;
  exportCanvas.height = fullHeight;
  const exportCtx = exportCanvas.getContext('2d');
  
  // Set high quality rendering
  exportCtx.imageSmoothingEnabled = true;
  exportCtx.imageSmoothingQuality = 'high';
  
  // Find current screenshot
  const currentScreenshot = currentScreenshotIndex !== null && 
                           currentScreenshotIndex !== undefined && 
                           screenshots[currentScreenshotIndex];
  
  // Draw the background
  if (currentSettings.useGradient) {
    const gradient = currentSettings.gradientDirection === 'circle' 
      ? exportCtx.createRadialGradient(fullWidth/2, fullHeight/2, 0, fullWidth/2, fullHeight/2, fullWidth/2)
      : createLinearGradient(exportCtx, currentSettings.gradientDirection, fullWidth, fullHeight);
    
    gradient.addColorStop(0, currentSettings.gradientColor1);
    gradient.addColorStop(1, currentSettings.gradientColor2);
    exportCtx.fillStyle = gradient;
  } else {
    exportCtx.fillStyle = 'white';
  }
  exportCtx.fillRect(0, 0, fullWidth, fullHeight);
  
  // Render the screenshot and frame if available
  if (currentScreenshot) {
    await renderScreenshotAndFrame({
      exportCtx,
      currentScreenshot,
      currentSettings,
      fullWidth,
      fullHeight,
      detectDeviceFromDimensions,
      getFrameSource
    });
  }
  
  // Draw text if needed
  if (fontsLoaded && currentSettings.showText) {
    renderTextOverlay({
      exportCtx, 
      currentSettings, 
      fullWidth, 
      fullHeight
    });
  }
  
  // Return the full-resolution canvas for export
  return {
    canvas: exportCanvas,
    fileName: `app-screenshot-${activePreviewIndex + 1}.png`
  };
}

// Helper function to render screenshot and frame
async function renderScreenshotAndFrame({
  exportCtx,
  currentScreenshot,
  currentSettings, 
  fullWidth,
  fullHeight,
  detectDeviceFromDimensions,
  getFrameSource
}) {
  // Load the screenshot
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  // Return a promise that resolves when rendering is complete
  return new Promise((resolve) => {
    img.onload = async () => {
      // Calculate if screenshot is landscape
      const isLandscape = img.width > img.height;
      
      // Detect device from dimensions
      const detectedDevice = detectDeviceFromDimensions(img.width, img.height);
      
      // Calculate center position
      const centerX = fullWidth / 2;
      const centerY = fullHeight / 2;
      
      // Calculate size based on orientation (at full resolution)
      let drawWidth, drawHeight;
      const baseSize = fullWidth / 1.33; // 75% of full width
      
      if (isLandscape) {
        drawWidth = baseSize;
        drawHeight = baseSize * (img.height / img.width);
      } else {
        drawHeight = baseSize;
        drawWidth = baseSize * (img.width / img.height);
      }
      
      // Draw the screenshot with all transformations
      exportCtx.save();
      exportCtx.translate(centerX, centerY);
      exportCtx.translate(
        (fullWidth * currentSettings.positionX) / 100,
        (fullHeight * currentSettings.positionY) / 100
      );
      exportCtx.rotate((currentSettings.rotation * Math.PI) / 180);
      exportCtx.scale(currentSettings.scale / 100, currentSettings.scale / 100);
      
      // Handle corner radius
      exportCtx.save();
      const scaleFactor = Math.min(fullWidth, fullHeight) / 1500; // Scale for full size
      const scaledCornerRadius = currentSettings.cornerRadius * scaleFactor;
      
      if (scaledCornerRadius > 0) {
        drawRoundedRect(exportCtx, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight, scaledCornerRadius);
        exportCtx.clip();
      }
      
      // Draw the screenshot
      exportCtx.drawImage(
        img, 
        0, 0, 
        img.width, img.height,
        -drawWidth/2, -drawHeight/2, drawWidth, drawHeight
      );
      
      // Restore from clipping
      exportCtx.restore();
      
      // If showing frame, load and draw it
      if (currentSettings.showFrame) {
        await renderDeviceFrame({
          exportCtx,
          detectedDevice,
          currentSettings,
          drawWidth,
          drawHeight,
          isLandscape,
          getFrameSource
        });
      }
      
      // Restore original context
      exportCtx.restore();
      resolve();
    };
    
    img.onerror = () => {
      console.error('Error loading screenshot image');
      resolve(); // Continue even if image fails to load
    };
    
    img.src = currentScreenshot.src;
  });
}

// Helper function to render device frame
async function renderDeviceFrame({
  exportCtx,
  detectedDevice,
  currentSettings,
  drawWidth,
  drawHeight,
  isLandscape,
  getFrameSource
}) {
  const frameImg = new Image();
  const frameSrc = getFrameSource(detectedDevice, currentSettings.frameColor || 'black');
  
  return new Promise((resolve) => {
    frameImg.onload = () => {
      // Draw the frame
      let frameWidth, frameHeight;
      if (isLandscape) {
        exportCtx.rotate(Math.PI / 2); // 90 degrees
        frameWidth = drawHeight * 1.1;
        frameHeight = frameWidth * (frameImg.height / frameImg.width);
      } else {
        frameWidth = drawWidth * 1.1;
        frameHeight = frameWidth * (frameImg.height / frameImg.width);
      }
      
      exportCtx.drawImage(frameImg, -frameWidth/2, -frameHeight/2, frameWidth, frameHeight);
      resolve();
    };
    frameImg.onerror = resolve; // Continue even if frame fails
    frameImg.src = frameSrc;
  });
}

// Helper function to render text overlay
function renderTextOverlay({
  exportCtx,
  currentSettings,
  fullWidth,
  fullHeight
}) {
  // Render text at full resolution
  exportCtx.save();
  
  // Improve font size scaling for exports
  // Change from (fullHeight / 1000) to a larger factor
  const fontScaleFactor = Math.max(3.5, fullHeight / 800); // Use at least 3.5x or scale based on height
  
  // Apply better scaling to font sizes
  const titleFontSize = currentSettings.titleFontSize * fontScaleFactor;
  const descriptionFontSize = currentSettings.descriptionFontSize * fontScaleFactor;
  
  // Calculate text position for title
  let titleX = fullWidth / 2;
  let titleY = fullHeight / 2;
  
  // Position based on settings
  switch (currentSettings.textPosition) {
    case 'top':
      titleY = fullHeight * 0.15;
      break;
    case 'bottom':
      titleY = fullHeight * 0.85;
      break;
    case 'custom':
      titleX = fullWidth * (currentSettings.textPositionX / 100);
      titleY = fullHeight * (currentSettings.textPositionY / 100);
      break;
    default:
      break;
  }
  
  // Get text content
  const title = currentSettings.textTitle || '';
  const description = currentSettings.textDescription || '';
  
  // Add text shadow
  exportCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  exportCtx.shadowBlur = 4 * fontScaleFactor;
  exportCtx.shadowOffsetX = 2 * fontScaleFactor;
  exportCtx.shadowOffsetY = 2 * fontScaleFactor;
  
  // Draw title with wrapping
  const titleMaxWidth = fullWidth * 0.8;
  exportCtx.font = `${currentSettings.titleFontWeight} ${titleFontSize}px ${currentSettings.titleFontFamily}`;
  exportCtx.fillStyle = currentSettings.textColor;
  exportCtx.textAlign = 'center';
  exportCtx.textBaseline = 'middle';
  const titleLines = wrapText(exportCtx, title, titleMaxWidth);
  let titleYOffset = titleY - titleFontSize * (titleLines.length / 2);
  
  titleLines.forEach((line, index) => {
    exportCtx.fillText(line, titleX, titleYOffset + (index * (titleFontSize * 1.2)));
  });
  
  // Calculate position for description
  let descriptionX = titleX; // Default to same X as title
  let descriptionY;
  
  if (currentSettings.descriptionPosition === 'custom') {
    // Use custom position for description
    descriptionX = fullWidth * (currentSettings.descriptionPositionX / 100);
    descriptionY = fullHeight * (currentSettings.descriptionPositionY / 100);
  } else {
    // Position below the title (default behavior)
    descriptionY = titleYOffset + (titleLines.length * (titleFontSize * 1.2)) + descriptionFontSize;
  }
  
  // Draw description with wrapping
  exportCtx.font = `${currentSettings.descriptionFontWeight} ${descriptionFontSize}px ${currentSettings.descriptionFontFamily}`;
  const descMaxWidth = fullWidth * 0.8;
  const descLines = wrapText(exportCtx, description, descMaxWidth);
  
  descLines.forEach((line, index) => {
    exportCtx.fillText(line, descriptionX, descriptionY + (index * (descriptionFontSize * 1.2)));
  });
  
  exportCtx.restore();
} 