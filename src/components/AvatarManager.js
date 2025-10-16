'use client';

import { useEffect, useState, useRef } from 'react';
import ModelViewer from './ModelViewer';
import AvatarCreator from './AvatarCreator';
import UrlUploader from './UrlUploader';
import BackgroundRenderer from './BackgroundRenderer';
import BackgroundSelector from './BackgroundSelector';
import { getSavedAvatars, saveAvatar, clearSavedAvatars } from '../services/avatarStorage';

export default function AvatarManager() {
  const [showCreator, setShowCreator] = useState(false);
  const [, setAvatarData] = useState(null);
  const [saved, setSaved] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState('necropolis');
  const modelViewerRef = useRef(null);

  useEffect(() => {
    setSaved(getSavedAvatars());
  }, []);

  const handleAvatarCreated = (data) => {
    console.log('Avatar created with data:', data);
    setAvatarData(data);
    saveAvatar(data);
    setSaved(getSavedAvatars());
    setShowCreator(false);
  };

  const handleUrlUploadSuccess = (data) => {
    console.log('URL upload successful:', data);
    setAvatarData(data);
    saveAvatar(data);
    setSaved(getSavedAvatars());
  };

  const handleError = (error) => {
    console.error('Avatar creation error:', error);
    setShowCreator(false);
  };

  const handleBackgroundChange = (backgroundId) => {
    setSelectedBackground(backgroundId);
  };

  const handleHiButtonClick = () => {
    console.log('Hi button clicked!');
    if (modelViewerRef.current) {
      console.log('ModelViewer ref found, calling playHiAnimation');
      modelViewerRef.current.playHiAnimation();
    } else {
      console.log('ModelViewer ref not found');
    }
  };

  const handleIdleButtonClick = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.returnToIdle();
    }
  };

  const handleJumpButtonClick = () => {
    console.log('Jump button clicked!');
    if (modelViewerRef.current) {
      console.log('ModelViewer ref found, calling playJumpAnimation');
      modelViewerRef.current.playJumpAnimation();
    } else {
      console.log('ModelViewer ref not found');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Avatar Manager</h1>
      
      {!showCreator && (
        <div className="space-y-6">
          <div className="space-y-4">
            <button
              onClick={() => setShowCreator(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create New Avatar
            </button>
          </div>

          <UrlUploader onUploadSuccess={handleUrlUploadSuccess} />
          
          {/* Hidden 'Latest Avatar' summary section as requested */}

          {saved.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Saved Avatars</h3>
                <button
                  onClick={() => { clearSavedAvatars(); setSaved([]); }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear
                </button>
              </div>
              <ul className="space-y-2 text-sm">
                {saved.map((item) => (
                  <li key={`${item.id}-${item.createdAt}`} className="p-2 bg-white rounded border">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <span><strong>ID:</strong> {item.id}</span>
                        <button
                          onClick={() => setSelectedAvatar(item)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          View 3D Model
                        </button>
                      </div>
                      <span className="truncate text-xs text-gray-600">
                        <strong>Original:</strong> {item.originalUrl}
                      </span>
                      {item.cloudinaryUrl && (
                        <span className="truncate text-xs text-gray-600">
                          <strong>Cloudinary:</strong> {item.cloudinaryUrl}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {showCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[95vh] flex flex-col">
            <div className="flex-shrink-0 p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Create Your Avatar</h2>
                <button
                  onClick={() => setShowCreator(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <AvatarCreator
                onAvatarCreated={handleAvatarCreated}
                onError={handleError}
                onClose={() => setShowCreator(false)}
                className="w-full h-full min-h-[600px]"
                showCloseButton={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3D Model Viewer Modal */}
      {selectedAvatar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg w-full max-w-6xl h-[90vh] flex flex-col relative overflow-hidden bg-transparent">
            {/* Background Renderer */}
            {selectedBackground !== 'necropolis' ? (
              <BackgroundRenderer 
                backgroundType={selectedBackground} 
                className="absolute inset-0 -z-10 pointer-events-none"
              />
            ) : null}
            
            <div className="flex-shrink-0 p-4 border-b bg-white/90 backdrop-blur-sm relative z-30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold">3D Avatar Viewer</h2>
                  <BackgroundSelector 
                    selectedBackground={selectedBackground}
                    onBackgroundChange={handleBackgroundChange}
                    className="relative inline-block z-20"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleIdleButtonClick}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      Idle
                    </button>
                    <button
                      onClick={handleHiButtonClick}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Hi
                    </button>
                    <button
                      onClick={handleJumpButtonClick}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Jump
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAvatar(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 p-4 relative">
              <ModelViewer 
                ref={modelViewerRef}
                modelUrl={selectedAvatar.cloudinaryUrl || selectedAvatar.originalUrl}
                name={`Avatar ${selectedAvatar.id}`}
                className="w-full h-full bg-transparent"
                backgroundType={selectedBackground}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}