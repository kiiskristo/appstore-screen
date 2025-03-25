import React from 'react';

function EditorTabs({ activeTab, setActiveTab }) {
  const tabs = [
    {
      id: 'device',
      label: 'Device',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
      )
    },
    {
      id: 'background',
      label: 'Background',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13 2v2h-2l-4 4-3 1 2 2 1 4 1.5 1.5L15 10l1-1V7l-2-3-1-2zm-9 9l-1 1.5.5 1.5 1-1.5L4 11z" />
        </svg>
      )
    },
    {
      id: 'screenshot',
      label: 'Screenshot',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
        </svg>
      )
    },
    {
      id: 'text',
      label: 'Text',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 5h12v3h-4v8H8V8H4V5z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-0 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center justify-center p-3 transition-colors ${
            activeTab === tab.id
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
              : 'hover:bg-white/50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          } ${
            tab.id === 'device' ? 'rounded-l-lg' : ''
          } ${
            tab.id === 'text' ? 'rounded-r-lg' : ''
          }`}
          title={tab.label}
        >
          {tab.icon}
          <span className="text-xs font-medium mt-1">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default EditorTabs; 