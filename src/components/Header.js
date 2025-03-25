import React from 'react';
import ProjectManager from './ProjectManager';

function Header({
  darkMode,
  toggleDarkMode,
  currentProject,
  screenshots,
  previewSettings,
  deviceType,
  orientation,
  activePreviewIndex,
  loadProject,
  setCurrentProject,
  hasUnsavedChanges,
  onSaveCurrentProject
}) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md py-4">
      <div className="container mx-auto px-5 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mr-4">
            AppStore Screenshot Generator
          </h1>
          {/* Add this GitHub link to your Header component */}
          <div className="flex items-center ml-4">
            <a
              href="https://github.com/kiiskristo/appstore-screen"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="View on GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.237 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>


        </div>

        {/* Show current project if one is loaded */}
        {currentProject && (
          <div className="text-gray-600 dark:text-gray-300 hidden md:block">
            <span className="text-sm">Current project:</span>
            <span className="font-medium ml-2">{currentProject.name}</span>
          </div>
        )}

        {/* Project Management Buttons */}
        <div className="flex items-center gap-4">
          <ProjectManager
            screenshots={screenshots}
            previewSettings={previewSettings}
            deviceType={deviceType}
            orientation={orientation}
            currentScreenshotIndex={previewSettings[activePreviewIndex]?.screenshotIndex}
            activePreviewIndex={activePreviewIndex}
            loadProject={loadProject}
            currentProject={currentProject}
            setCurrentProject={setCurrentProject}
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveCurrentProject={onSaveCurrentProject}
          />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}

export default Header; 