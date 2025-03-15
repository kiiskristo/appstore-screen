import React from 'react';
import DeviceSettings from './editor/DeviceSettings';
import ScreenshotUploader from './editor/ScreenshotUploader';
import BackgroundSettings from './editor/BackgroundSettings';
import ImageSettings from './editor/ImageSettings';
import TextOverlaySettings from './editor/TextOverlaySettings';
import DeviceFrameSettings from './editor/DeviceFrameSettings';

function EditorPanel({
  deviceType,
  setDeviceType,
  orientation,
  setOrientation,
  screenshots,
  setScreenshots,
  currentScreenshotIndex,
  setCurrentScreenshotIndex,
  previewSettings,
  updatePreviewSetting,
  updateMultipleSettings,
  deviceDimensions,
  darkMode
}) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[350px] bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md flex flex-col gap-4 overflow-y-auto max-h-[85vh] transition-colors duration-200">
      <DeviceSettings 
        deviceType={deviceType}
        setDeviceType={setDeviceType}
        orientation={orientation}
        setOrientation={setOrientation}
        deviceDimensions={deviceDimensions}
        updatePreviewSetting={updatePreviewSetting}
        darkMode={darkMode}
      />
      
      <ScreenshotUploader 
        screenshots={screenshots}
        setScreenshots={setScreenshots}
        currentScreenshotIndex={currentScreenshotIndex}
        setCurrentScreenshotIndex={setCurrentScreenshotIndex}
        darkMode={darkMode}
      />
      
      <BackgroundSettings 
        useGradient={previewSettings.useGradient}
        gradientDirection={previewSettings.gradientDirection}
        gradientColor1={previewSettings.gradientColor1}
        gradientColor2={previewSettings.gradientColor2}
        updatePreviewSetting={updatePreviewSetting}
        darkMode={darkMode}
      />
      
      <ImageSettings 
        rotation={previewSettings.rotation}
        scale={previewSettings.scale}
        positionX={previewSettings.positionX}
        positionY={previewSettings.positionY}
        updatePreviewSetting={updatePreviewSetting}
        darkMode={darkMode}
      />
      
      <TextOverlaySettings 
        showText={previewSettings.showText}
        textTitle={previewSettings.textTitle}
        textDescription={previewSettings.textDescription}
        titleFontSize={previewSettings.titleFontSize}
        titleFontFamily={previewSettings.titleFontFamily}
        descriptionFontSize={previewSettings.descriptionFontSize}
        descriptionFontFamily={previewSettings.descriptionFontFamily}
        textColor={previewSettings.textColor}
        textPosition={previewSettings.textPosition}
        textPositionX={previewSettings.textPositionX}
        textPositionY={previewSettings.textPositionY}
        updatePreviewSetting={updatePreviewSetting}
        darkMode={darkMode}
      />
      
      <DeviceFrameSettings 
        showFrame={previewSettings.showFrame}
        frameColor={previewSettings.frameColor}
        updatePreviewSetting={updatePreviewSetting}
        darkMode={darkMode}
      />

    </div>
  );
}

export default EditorPanel; 