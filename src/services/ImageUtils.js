// Create utilities for image handling

/**
 * Compresses an image by reducing its quality and optionally its dimensions
 * @param {string} imageSrc - The data URL of the image
 * @param {number} quality - Quality from 0 to 1 (0.7 is a good default)
 * @param {number} maxWidth - Optional maximum width to resize to
 * @returns {Promise<string>} A promise that resolves to the compressed data URL
 */
export const compressImage = (imageSrc, quality = 0.7, maxWidth = null) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions if resizing
        let width = img.width;
        let height = img.height;
        
        if (maxWidth && width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get compressed data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = (err) => reject(err);
      img.src = imageSrc;
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Checks if a data URL is larger than a specified size limit
 * @param {string} dataUrl - The data URL to check
 * @param {number} limitMb - Size limit in MB
 * @returns {boolean} True if the data URL exceeds the limit
 */
export const isDataUrlTooLarge = (dataUrl, limitMb = 5) => {
  // Rough estimation of data URL size
  // Base64 encodes 3 bytes in 4 chars
  const base64 = dataUrl.split(',')[1];
  const sizeInBytes = (base64.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  return sizeInMB > limitMb;
}; 