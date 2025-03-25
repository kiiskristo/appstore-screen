import React, { useState } from 'react';
import DeviceSettings from './editor/DeviceSettings';
import ScreenshotUploader from './editor/ScreenshotUploader';
import BackgroundSettings from './editor/BackgroundSettings';
import ImageSettings from './editor/ImageSettings';
import TextOverlaySettings from './editor/TextOverlaySettings';
import DeviceFrameSettings from './editor/DeviceFrameSettings';
import EditorTabs from './editor/EditorTabs';

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
  const [activeTab, setActiveTab] = useState('device');

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'device':
        return (
          <DeviceSettings 
            deviceType={deviceType}
            setDeviceType={setDeviceType}
            orientation={orientation}
            setOrientation={setOrientation}
            deviceDimensions={deviceDimensions}
            updatePreviewSetting={updatePreviewSetting}
            darkMode={darkMode}
          />
        );
      case 'background':
        return (
          <BackgroundSettings 
            useGradient={previewSettings.useGradient}
            gradientDirection={previewSettings.gradientDirection}
            gradientColor1={previewSettings.gradientColor1}
            gradientColor2={previewSettings.gradientColor2}
            updatePreviewSetting={updatePreviewSetting}
            darkMode={darkMode}
          />
        );
      case 'screenshot':
        return (
          <>
            <ScreenshotUploader 
              screenshots={screenshots}
              setScreenshots={setScreenshots}
              currentScreenshotIndex={currentScreenshotIndex}
              setCurrentScreenshotIndex={setCurrentScreenshotIndex}
              darkMode={darkMode}
            />
            <DeviceFrameSettings 
              showFrame={previewSettings.showFrame}
              frameColor={previewSettings.frameColor}
              updatePreviewSetting={updatePreviewSetting}
              darkMode={darkMode}
            />
            <ImageSettings 
              rotation={previewSettings.rotation}
              scale={previewSettings.scale}
              positionX={previewSettings.positionX}
              positionY={previewSettings.positionY}
              cornerRadius={previewSettings.cornerRadius}
              updatePreviewSetting={updatePreviewSetting}
              darkMode={darkMode}
            />
          </>
        );
      case 'text':
        return (
          <TextOverlaySettings 
            showText={previewSettings.showText}
            textTitle={previewSettings.textTitle}
            textDescription={previewSettings.textDescription}
            titleFontSize={previewSettings.titleFontSize}
            titleFontFamily={previewSettings.titleFontFamily}
            titleFontWeight={previewSettings.titleFontWeight}
            descriptionFontSize={previewSettings.descriptionFontSize}
            descriptionFontFamily={previewSettings.descriptionFontFamily}
            descriptionFontWeight={previewSettings.descriptionFontWeight}
            textColor={previewSettings.textColor}
            textPosition={previewSettings.textPosition}
            textPositionX={previewSettings.textPositionX}
            textPositionY={previewSettings.textPositionY}
            descriptionPosition={previewSettings.descriptionPosition}
            descriptionPositionX={previewSettings.descriptionPositionX}
            descriptionPositionY={previewSettings.descriptionPositionY}
            updatePreviewSetting={updatePreviewSetting}
            darkMode={darkMode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 min-w-[280px] max-w-[350px] bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md flex flex-col gap-4 overflow-y-auto h-[85vh] transition-colors duration-200">
      <EditorTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderActiveSection()}
    </div>
  );
}

export default EditorPanel; 