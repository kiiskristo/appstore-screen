import React, { useState, useEffect } from 'react';
import { compressImage } from '../services/ImageUtils';
import StorageService from '../services/StorageService';

function ProjectManager({ 
  screenshots, 
  previewSettings, 
  deviceType, 
  orientation, 
  currentScreenshotIndex, 
  activePreviewIndex,
  loadProject,
  currentProject,
  setCurrentProject,
  hasUnsavedChanges,
  onSaveCurrentProject
}) {
  const [projects, setProjects] = useState([]);
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [importError, setImportError] = useState('');
  
  // Load saved projects list on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('appScreenshotProjects');
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (e) {
        console.error('Error loading projects:', e);
      }
    }
  }, []);
  
  // Save a project as a new project
  const saveAsNewProject = async () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }
    
    try {
      // Generate a new ID
      const projectId = Date.now().toString();
      
      // Compress screenshots
      const compressedScreenshots = await Promise.all(
        screenshots.map(async screenshot => {
          const compressedSrc = await compressImage(screenshot.src, 0.6);
          return {
            name: screenshot.name,
            src: compressedSrc,
          };
        })
      );
      
      // Create project data
      const projectData = {
        id: projectId,
        name: projectName,
        deviceType,
        orientation,
        currentScreenshotIndex,
        activePreviewIndex,
        previewSettings,
        screenshots: compressedScreenshots
      };
      
      // Update projects list
      const allProjects = JSON.parse(localStorage.getItem('appScreenshotProjects') || '[]');
      const projectEntry = {
        id: projectId,
        name: projectName,
        date: new Date().toISOString(),
      };
      const updatedProjects = [...allProjects, projectEntry];
      localStorage.setItem('appScreenshotProjects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      
      // Save project data
      await StorageService.saveCurrentProject(projectId, projectData);
      
      // Update current project
      const projectInfo = {
        id: projectId,
        name: projectName,
        lastSaved: new Date().toISOString()
      };
      setCurrentProject(projectInfo);
      StorageService.saveCurrentProjectInfo(projectInfo);
      
      // Close dialog and reset
      setProjectName('');
      setIsSaveAsOpen(false);
      
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };
  
  // Quick save current project
  const quickSave = async () => {
    if (!currentProject) return;
    
    console.log("Quick saving project with ID:", currentProject.id, "Name:", currentProject.name);
    await onSaveCurrentProject(currentProject.id, currentProject.name);
  };
  
  // Load a project
  const handleLoadProject = async (projectId) => {
    try {
      const projectInfo = projects.find(p => p.id === projectId);
      if (!projectInfo) {
        console.error('Project info not found for ID:', projectId);
        return;
      }
      
      StorageService.saveCurrentProjectInfo(projectInfo);
      setCurrentProject(projectInfo);
      
      const projectData = await StorageService.loadProject(projectId);
      if (projectData) {
        loadProject(projectData);
        setIsProjectListOpen(false);
      } else {
        console.error('Could not load project data for ID:', projectId);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };
  
  // Delete a project
  const deleteProject = (projectId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      localStorage.removeItem(`appScreenshotProject_${projectId}`);
      localStorage.setItem('appScreenshotProjects', JSON.stringify(updatedProjects));
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Export project as JSON
  const exportProjectAsJson = async () => {
    if (!currentProject) {
      alert('Please save your project before exporting.');
      return;
    }
    
    try {
      const projectData = await StorageService.loadProject(currentProject.id);
      if (!projectData) {
        alert('Could not load project data for export.');
        return;
      }
      
      const exportData = {
        id: currentProject.id,
        name: currentProject.name,
        date: currentProject.lastSaved || new Date().toISOString(),
        data: projectData
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `${currentProject.name.replace(/\s+/g, '_')}_export.json`;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting project:', error);
      alert('Failed to export project: ' + error.message);
    }
  };
  
  // Import project from JSON
  const importProjectFromJson = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setImportError('');
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          if (!importData.id || !importData.name || !importData.data) {
            setImportError('Invalid project file format.');
            return;
          }
          
          // Ensure required structures exist
          if (!importData.data.screenshots) {
            importData.data.screenshots = [];
          }
          
          if (!importData.data.previewSettings || !Array.isArray(importData.data.previewSettings) || importData.data.previewSettings.length === 0) {
            importData.data.previewSettings = [{
              // Default preview settings
              screenshotIndex: -1,
              rotation: 0,
              scale: 90,
              positionX: 0,
              positionY: 0,
              cornerRadius: 24,
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
              titleFontWeight: 'bold',
              descriptionFontWeight: 'normal',
            }];
          }
          
          // Use a new ID to avoid conflicts
          const projectId = Date.now().toString();
          const projectName = `${importData.name} (Imported)`;
          
          // Save the imported project
          await StorageService.saveCurrentProject(projectId, importData.data);
          
          // Create project info
          const projectInfo = {
            id: projectId,
            name: projectName,
            lastSaved: new Date().toISOString()
          };
          
          StorageService.saveCurrentProjectInfo(projectInfo);
          setCurrentProject(projectInfo);
          
          // Update projects list
          const updatedProjects = [...projects, projectInfo];
          setProjects(updatedProjects);
          localStorage.setItem('appScreenshotProjects', JSON.stringify(updatedProjects));
          
          // Load the imported project
          loadProject(importData.data);
          
          // Close the dialog
          setIsImportExportOpen(false);
          
          alert('Project imported successfully!');
        } catch (parseError) {
          console.error('Error parsing import data:', parseError);
          setImportError('Could not parse project file. It may be corrupted.');
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing project:', error);
      setImportError('Failed to import project: ' + error.message);
    }
  };
  
  return (
    <div className="relative flex gap-2">
      {/* Quick Save Button */}
      {currentProject && (
        <button 
          className={`${
            hasUnsavedChanges 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-gray-400 hover:bg-gray-500"
          } text-white py-2 px-4 rounded-lg transition-colors`}
          onClick={quickSave}
          title={hasUnsavedChanges ? "Save changes" : "No changes to save"}
        >
          Save
        </button>
      )}
      
      {/* Save As Button */}
      <button 
        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => {
          setIsSaveAsOpen(true);
          setIsProjectListOpen(false);
          setIsImportExportOpen(false);
          setProjectName('');
        }}
        title="Save as new project"
      >
        Save As
      </button>
      
      {/* Projects Button */}
      <button 
        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => {
          setIsProjectListOpen(!isProjectListOpen);
          setIsSaveAsOpen(false);
          setIsImportExportOpen(false);
        }}
      >
        Projects
      </button>
      
      {/* Import/Export Button */}
      <button 
        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => {
          setIsImportExportOpen(!isImportExportOpen);
          setIsProjectListOpen(false);
          setIsSaveAsOpen(false);
        }}
      >
        Import/Export
      </button>
      
      {/* Save As Dialog */}
      {isSaveAsOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-10">
          <h3 className="text-lg font-semibold mb-3 dark:text-white">Save Project As</h3>
          
          <div className="mb-4">
            <input
              type="text"
              className="editor-input mb-2"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                className="bg-green-600 text-white py-1 px-3 rounded-lg hover:bg-green-700 transition-colors"
                onClick={saveAsNewProject}
                disabled={!projectName.trim()}
              >
                Save New Project
              </button>
              <button 
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                onClick={() => setIsSaveAsOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Project List Dialog */}
      {isProjectListOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-10">
          <h3 className="text-lg font-semibold mb-3 dark:text-white">Open Project</h3>
          
          <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            {projects.length === 0 ? (
              <p className="p-3 dark:text-gray-300">No saved projects</p>
            ) : (
              <ul>
                {projects.map(project => (
                  <li 
                    key={project.id}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
                    onClick={() => handleLoadProject(project.id)}
                  >
                    <div>
                      <div className="font-medium dark:text-white">{project.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(project.date)}
                      </div>
                    </div>
                    <div>
                      <button 
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        onClick={(e) => deleteProject(project.id, e)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="mt-2 flex justify-end">
            <button 
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={() => setIsProjectListOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Import/Export Dialog */}
      {isImportExportOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-10">
          <h3 className="text-lg font-semibold mb-3 dark:text-white">Import/Export Project</h3>
          
          <div className="flex gap-2 mb-4">
            <button 
              className="bg-green-600 text-white py-1 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              onClick={exportProjectAsJson}
              disabled={!currentProject}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Project
            </button>
            
            <label className="bg-purple-600 text-white py-1 px-3 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
              </svg>
              Import Project
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={importProjectFromJson} 
              />
            </label>
          </div>
          
          {importError && (
            <div className="text-red-500 text-sm mb-4">{importError}</div>
          )}
          
          <div className="mt-2 flex justify-end">
            <button 
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={() => setIsImportExportOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectManager; 