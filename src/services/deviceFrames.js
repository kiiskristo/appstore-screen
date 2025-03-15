const deviceFrames = {
  iphone: {
    portrait: {
      black: "https://via.placeholder.com/500x800",
      white: "https://via.placeholder.com/500x800",
      silver: "https://via.placeholder.com/500x800",
      gold: "https://via.placeholder.com/500x800",
    },
    landscape: {
      black: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
      white: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
      silver: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
      gold: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
    }
  },
  ipad: {
    portrait: {
      black: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
      white: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
      silver: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
      gold: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
    },
    landscape: {
      black: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
      white: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
      silver: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
      gold: process.env.PUBLIC_URL + '/assets/frames/iPhone 16 - Black - Portrait.png',
    }
  }
};

// Define the screen area for each device (where the screenshot should appear)
// These are percentages relative to the frame size
const screenAreas = {
  iphone: {
    portrait: { top: 8, left: 4, width: 92, height: 85 },
    landscape: { top: 4, left: 8, width: 85, height: 92 }
  },
  ipad: {
    portrait: { top: 7, left: 5, width: 90, height: 86 },
    landscape: { top: 5, left: 7, width: 86, height: 90 }
  }
};

export { deviceFrames, screenAreas }; 