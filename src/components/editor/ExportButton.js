import React from 'react';

function ExportButton({ screenshots, previewSettings }) {
  const handleExport = () => {
    // Since the actual export functionality requires DOM access and refs
    // which are in the PreviewPanel component, we're providing a simple alert here
    alert(`Will export ${previewSettings.length} screenshot${previewSettings.length > 1 ? 's' : ''}.`);
    
    // In a real implementation, you'd need to access the preview refs
    // This could be done with Context or by lifting this logic up to a parent component
  };
  
  const hasScreenshots = screenshots && screenshots.length > 0;
  
  return (
    <div className="mt-4">
      <button 
        className="btn-primary w-full"
        onClick={handleExport}
        disabled={!hasScreenshots}
      >
        Export {previewSettings.length > 1 ? 'All Screenshots' : 'Screenshot'}
      </button>
      
      {!hasScreenshots && (
        <p className="text-sm text-red-500 mt-2">Please upload at least one screenshot first</p>
      )}
    </div>
  );
}

export default ExportButton; 