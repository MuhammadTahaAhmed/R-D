'use client';

import { useRef, useState, useCallback } from 'react';

export default function CameraCapture({ onCapture, onClose, className = "w-full h-96" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front camera
        }
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsStreaming(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Check if video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Video not ready for capture');
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      console.log('Capturing photo with dimensions:', {
        width: canvas.width,
        height: canvas.height
      });

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob && onCapture) {
          console.log('Camera capture blob created:', {
            size: blob.size,
            type: blob.type
          });
          
          // Create a File object from the blob
          const file = new File([blob], 'camera-capture.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          console.log('File object created:', {
            name: file.name,
            size: file.size,
            type: file.type
          });
          
          onCapture(file);
        } else {
          console.error('Failed to create blob or onCapture callback missing');
        }
      }, 'image/jpeg', 0.9);

      // Stop camera after capture
      stopCamera();
    } catch (error) {
      console.error('Error during photo capture:', error);
    }
  }, [onCapture, stopCamera]);

  const handleClose = () => {
    stopCamera();
    if (onClose) onClose();
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ display: isStreaming ? 'block' : 'none' }}
      />

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Controls Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-white font-semibold">Take a Photo</h3>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center">
          {!isStreaming && !error && (
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-white text-lg mb-4">Camera Ready</p>
              <button
                onClick={startCamera}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start Camera
              </button>
            </div>
          )}

          {error && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <button
                onClick={() => setError(null)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        {isStreaming && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
            >
              <div className="w-12 h-12 bg-gray-800 rounded-full"></div>
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {isStreaming && (
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white text-sm text-center bg-black bg-opacity-50 rounded-lg py-2 px-4">
            Position your face in the center and tap the capture button
          </p>
        </div>
      )}
    </div>
  );
}
