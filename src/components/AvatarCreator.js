'use client';

import { useEffect, useRef, useState } from 'react';
import { RPM_CONFIG, validateRPMConfig } from '../config/rpm';
import { processAvatar } from '../services/avatarProcessor';

export default function AvatarCreator({ 
  onAvatarCreated, 
  onError,
  className = "w-full h-full min-h-[600px] border-0 rounded-lg",
  showCloseButton = true,
  onClose 
}) {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [cloudinaryUrl, setCloudinaryUrl] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [autoUploading, setAutoUploading] = useState(false);

  useEffect(() => {
    // Validate configuration
    if (!validateRPMConfig()) {
      const configError = 'Ready Player Me configuration is incomplete. Please check your credentials.';
      setError(configError);
      if (onError) onError(configError);
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) return;

    // Set a timeout to handle cases where the iframe doesn't load
    const loadTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Avatar Creator loading timeout - it may still be loading');
        setIsLoading(false);
      }
    }, 15000); // 15 second timeout

    const handleMessage = (event) => {
      // Verify the message is from Ready Player Me
      if (event.origin !== `https://${RPM_CONFIG.subdomain}.readyplayer.me`) {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        
        switch (data.eventName) {
          case 'v1.avatar.exported':
            console.log('Avatar created successfully:', data.data);
            
            // Auto-upload immediately without user interaction
            setAutoUploading(true);
            setIsProcessing(true);
            setProcessingProgress(0);
            
            processAvatar(data.data.url, data.data.id, (progress) => {
              setProcessingProgress(progress);
            })
            .then((result) => {
              console.log('Avatar processed successfully:', result);
              setCloudinaryUrl(result.cloudinaryUrl);
              setIsProcessing(false);
              setAutoUploading(false);
              
              // Show success popup and auto-close webview
              setShowSuccessPopup(true);
              
              // Auto-close after 2 seconds
              setTimeout(() => {
                if (onClose) onClose();
              }, 2000);
              
              if (onAvatarCreated) {
                onAvatarCreated({
                  url: data.data.url,
                  cloudinaryUrl: result.cloudinaryUrl,
                  id: data.data.id,
                  metadata: data.data
                });
              }
            })
            .catch((error) => {
              console.error('Avatar processing failed:', error);
              setIsProcessing(false);
              setAutoUploading(false);
              setProcessingProgress(0);
              
              const processingError = `Avatar processing failed: ${error.message}`;
              setError(processingError);
              if (onError) onError(processingError);
            });
            break;
            
          case 'v1.avatar.exported.failed':
            console.error('Avatar creation failed:', data.data);
            const errorMsg = data.data?.message || 'Avatar creation failed';
            setError(errorMsg);
            if (onError) onError(errorMsg);
            break;
            
          case 'v1.avatar.creator.loaded':
            console.log('Avatar Creator loaded');
            setIsLoading(false);
            break;
            
          case 'v1.avatar.creator.loaded.failed':
            console.error('Avatar Creator failed to load:', data.data);
            const loadError = data.data?.message || 'Failed to load Avatar Creator';
            setError(loadError);
            if (onError) onError(loadError);
            break;
            
          case 'v1.frame.ready':
            console.log('Frame ready - Avatar Creator initialized');
            setIsLoading(false);
            break;
            
          case 'v1.avatar.creator.opened':
            console.log('Avatar Creator opened');
            break;
            
          case 'v1.avatar.creator.closed':
            console.log('Avatar Creator closed');
            break;
            
          case 'v1.user.set':
            console.log('User set in Avatar Creator');
            break;
            
          default:
            console.log('Unhandled event:', data.eventName, data.data);
        }
      } catch (err) {
        console.error('Error parsing message from Avatar Creator:', err);
      }
    };

    // Monitor webview for URL changes
    const monitorWebview = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      try {
        // Check if we can access the iframe content
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // Look for Ready Player Me URLs in the page content
          const pageText = iframeDoc.body?.innerText || '';
          const urlMatch = pageText.match(/https:\/\/models\.readyplayer\.me\/[a-zA-Z0-9]+\.glb/g);
          
          if (urlMatch && urlMatch.length > 0 && !autoUploading && !isProcessing) {
            const detectedUrl = urlMatch[0];
            console.log('Detected Ready Player Me URL:', detectedUrl);
            
            // Auto-upload the detected URL
            setAutoUploading(true);
            setIsProcessing(true);
            setProcessingProgress(0);
            
            processAvatar(detectedUrl, `auto-${Date.now()}`, (progress) => {
              setProcessingProgress(progress);
            })
            .then((result) => {
              console.log('Auto-upload successful:', result);
              setCloudinaryUrl(result.cloudinaryUrl);
              setIsProcessing(false);
              setAutoUploading(false);
              
              // Show success popup and auto-close webview
              setShowSuccessPopup(true);
              
              // Auto-close after 2 seconds
              setTimeout(() => {
                if (onClose) onClose();
              }, 2000);
              
              if (onAvatarCreated) {
                onAvatarCreated({
                  url: detectedUrl,
                  cloudinaryUrl: result.cloudinaryUrl,
                  id: `auto-${Date.now()}`,
                  metadata: { autoDetected: true }
                });
              }
            })
            .catch((error) => {
              console.error('Auto-upload failed:', error);
              setIsProcessing(false);
              setAutoUploading(false);
              setProcessingProgress(0);
              
              const processingError = `Auto-upload failed: ${error.message}`;
              setError(processingError);
              if (onError) onError(processingError);
            });
          }
        }
      } catch (err) {
        // Cross-origin restrictions - this is expected
        // We'll rely on the message events instead
      }
    };

    // Monitor webview every 2 seconds
    const monitorInterval = setInterval(monitorWebview, 2000);

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(loadTimeout);
      clearInterval(monitorInterval);
    };
  }, [onAvatarCreated, onError, autoUploading, isProcessing]);

  const handleClose = () => {
    if (onClose) onClose();
  };

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-lg`}>
        <div className="text-red-600 text-center">
          <h3 className="font-semibold mb-2">Error Loading Avatar Creator</h3>
          <p className="text-sm">{error}</p>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading Avatar Creator...</p>
          </div>
        </div>
      )}
      
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {autoUploading ? 'Auto-Uploading Avatar' : 'Processing Avatar'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {autoUploading 
                ? 'Automatically uploading to Cloudinary...' 
                : 'Downloading and uploading to Cloudinary...'
              }
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{Math.round(processingProgress)}% complete</p>
            {autoUploading && (
              <p className="text-xs text-blue-600 mt-2">
                ✨ No user action required - uploading automatically!
              </p>
            )}
          </div>
        </div>
      )}
      
      {showSuccessPopup && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-xl">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">Uploaded Successfully!</h3>
            <p className="text-lg text-gray-700 mb-4">
              Your 3D avatar has been uploaded to Cloudinary.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Cloudinary URL:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={cloudinaryUrl}
                  readOnly
                  className="flex-1 text-xs p-2 border rounded bg-white"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(cloudinaryUrl)}
                  className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Closing automatically in 2 seconds...
            </p>
          </div>
        </div>
      )}
      
      {showCloseButton && (
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-20 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md"
          aria-label="Close Avatar Creator"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      <iframe
        ref={iframeRef}
        src={RPM_CONFIG.avatarCreatorUrl}
        className={className}
        allow="camera *; microphone *"
        title="Ready Player Me Avatar Creator"
      />
    </div>
  );
}
