import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EditorPanel from './components/EditorPanel';
import CanvasPreviewPanel from './components/CanvasPreviewPanel';
import PreviewContainer from './components/PreviewContainer';

function App() {
  // Global state for the application
  const [deviceType, setDeviceType] = useState('iphone');
  const [orientation, setOrientation] = useState('portrait');
  const [screenshots, setScreenshots] = useState([]);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(-1);
  const [previewSettings, setPreviewSettings] = useState([{
    screenshotIndex: -1,
    orientation: 'portrait',
    rotation: 0,
    scale: 90,
    positionX: 0,
    positionY: 0,
    useGradient: false,
    gradientDirection: 'to right',
    gradientColor1: '#4a6bff',
    gradientColor2: '#45caff',
    showText: false,
    textTitle: 'Your App Name',
    textDescription: 'The perfect solution for your needs',
    titleFontSize: 24,
    titleFontFamily: "'Segoe UI', sans-serif",
    descriptionFontSize: 16,
    descriptionFontFamily: "'Segoe UI', sans-serif",
    textColor: '#ffffff',
    textPosition: 'bottom',
    textPositionX: 50,
    textPositionY: 80,
    showFrame: true,
    frameColor: 'black'
  }]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(null);

  // Detect System Preference and User Preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userPreference = localStorage.getItem('theme');
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (userPreference === 'dark' || (!userPreference && systemPreference)) {
        document.documentElement.classList.add('dark');
        setDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        setDarkMode(false);
      }
    }
  }, []);

  // Toggle dark mode and save preference
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  };

  // Device dimensions data
  const deviceDimensions = {
    iphone: {
      portrait: { width: 1320, height: 2868 },
      landscape: { width: 2868, height: 1320 }
    },
    ipad: {
      portrait: { width: 2048, height: 2732 },
      landscape: { width: 2732, height: 2048 }
    }
  };

  // Update settings for current preview
  const updatePreviewSetting = (key, value) => {
    setPreviewSettings(prevSettings => {
      const newSettings = [...prevSettings];
      newSettings[activePreviewIndex] = {
        ...newSettings[activePreviewIndex],
        [key]: value
      };
      return newSettings;
    });
  };

  // Handle multiple settings updates at once
  const updateMultipleSettings = (settingsObject) => {
    setPreviewSettings(prevSettings => {
      const newSettings = [...prevSettings];
      newSettings[activePreviewIndex] = {
        ...newSettings[activePreviewIndex],
        ...settingsObject
      };
      return newSettings;
    });
  };

  // Add new preview
  const addPreview = () => {
    if (previewSettings.length >= 6) {
      alert('Maximum of 6 previews allowed');
      return;
    }
    
    setPreviewSettings(prev => [
      ...prev, 
      {...prev[activePreviewIndex]}
    ]);
    
    setActivePreviewIndex(previewSettings.length);
  };

  // Remove current preview
  const removePreview = () => {
    if (previewSettings.length <= 1) {
      alert('Cannot remove the last preview');
      return;
    }
    
    setPreviewSettings(prev => {
      const newSettings = [...prev];
      newSettings.splice(activePreviewIndex, 1);
      return newSettings;
    });
    
    setActivePreviewIndex(0);
  };

  // Switch between previews
  const switchPreview = (index) => {
    setActivePreviewIndex(index);
  };

  // Update the screenshot selection inside the App component
  const handleScreenshotSelect = (index) => {
    setCurrentScreenshotIndex(index);
    
    // Also update the current preview settings to use this screenshot
    setPreviewSettings(prevSettings => {
      const newSettings = [...prevSettings];
      newSettings[activePreviewIndex] = {
        ...newSettings[activePreviewIndex],
        screenshotIndex: index
      };
      return newSettings;
    });
  };

  return (
    <div className="app min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="container mx-auto p-5">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-2 min-w-[300px]">
            <EditorPanel 
              deviceType={deviceType}
              setDeviceType={setDeviceType}
              orientation={orientation}
              setOrientation={setOrientation}
              screenshots={screenshots}
              setScreenshots={setScreenshots}
              currentScreenshotIndex={currentScreenshotIndex}
              setCurrentScreenshotIndex={handleScreenshotSelect}
              previewSettings={previewSettings[activePreviewIndex]}
              updatePreviewSetting={updatePreviewSetting}
              updateMultipleSettings={updateMultipleSettings}
              deviceDimensions={deviceDimensions}
              darkMode={darkMode}
            />
          </div>
          
          <PreviewContainer
            deviceType={deviceType}
            orientation={orientation}
            scale={0.2}
            previewSettings={previewSettings}
            activePreviewIndex={activePreviewIndex}
            switchPreview={switchPreview}
            addPreview={addPreview}
            removePreview={removePreview}
            deviceDimensions={deviceDimensions}
            screenshots={screenshots}
            currentScreenshotIndex={currentScreenshotIndex}
            exportButtons={
              <div className="flex gap-3 mt-6">
                <button 
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => window.activePreviewCanvas?.exportCanvas()}
                >
                  Export Current
                </button>
                
                {previewSettings.length > 1 && (
                  <button 
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => window.activePreviewCanvas?.exportAllScreenshots()}
                  >
                    Export All
                  </button>
                )}
              </div>
            }
            darkMode={darkMode}
          >
            <CanvasPreviewPanel
              id="canvas-preview"
              deviceType={deviceType}
              orientation={orientation}
              screenshots={screenshots}
              currentScreenshotIndex={currentScreenshotIndex}
              previewSettings={previewSettings}
              activePreviewIndex={activePreviewIndex}
              deviceDimensions={deviceDimensions}
              switchPreview={switchPreview}
              ref={node => window.activePreviewCanvas = node}
            />
          </PreviewContainer>
        </div>
      </div>

      <div className="bg-blue-500 text-white p-4 m-4 rounded-lg">
        This should be a blue box with white text if Tailwind is working correctly.
      </div>
    </div>
  );
}

export default App; 