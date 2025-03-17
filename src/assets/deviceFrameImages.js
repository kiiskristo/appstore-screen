import iPhone14BlackPortrait from './frames/iPhone 14 - Black - Portrait.png';
import iPhone14WhitePortrait from './frames/iPhone 14 - White - Portrait.png';
import iPhone16BlackPortrait from './frames/iPhone 16 - Black - Portrait.png';
import iPhone16WhitePortrait from './frames/iPhone 16 - White - Portrait.png';
// Import other frames as needed

// Export the frame images with their corresponding dimensions
export const deviceFrames = {
  iphone14: {
    dimensions: { width: 2532, height: 1170 },
    frames: {
      black: iPhone14BlackPortrait,
      white: iPhone14WhitePortrait
    }
  },
  iphone16: {
    dimensions: { width: 2556, height: 1179 },
    frames: {
      black: iPhone16BlackPortrait,
      white: iPhone16WhitePortrait
    }
  }
};

// Helper function to detect device type based on dimensions
export function detectDeviceFromDimensions(width, height) {
  // Check for iPhone 14
  if (Math.abs(width - 2532) < 50 && Math.abs(height - 1170) < 50) {
    return 'iphone14';
  }
  // Check for iPhone 16
  else if (Math.abs(width - 2556) < 50 && Math.abs(height - 1179) < 50) {
    return 'iphone16';
  }
  // Default to iPhone 16 if nothing matches
  return 'iphone16';
}

// Helper function to get frame source
export function getFrameSource(deviceType, color) {
  if (!deviceFrames[deviceType]) {
    return deviceFrames.iphone16.frames.black; // Default fallback
  }
  
  const frames = deviceFrames[deviceType].frames;
  return frames[color] || frames.black; // Return requested color or black as fallback
}

export {
  iPhone14BlackPortrait,
  iPhone14WhitePortrait,
  iPhone16BlackPortrait,
  iPhone16WhitePortrait,
  // Export other frames
}; 