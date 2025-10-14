'use client';

import { useState, useEffect } from 'react';

export default function UrlUploader({ onUploadSuccess }) {
  const [modelUrl, setModelUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [autoDetected, setAutoDetected] = useState(false);

  // Auto-detect Ready Player Me URLs
  const isReadyPlayerMeUrl = (url) => {
    return url.includes('models.readyplayer.me') && url.includes('.glb');
  };

  // Auto-upload when URL is detected
  useEffect(() => {
    if (modelUrl && isReadyPlayerMeUrl(modelUrl) && !isUploading && !result) {
      setAutoDetected(true);
      handleAutoUpload();
    }
  }, [modelUrl]);

  // Monitor clipboard for Ready Player Me URLs
  useEffect(() => {
    const handlePaste = (e) => {
      const pastedText = e.clipboardData.getData('text');
      if (isReadyPlayerMeUrl(pastedText)) {
        setModelUrl(pastedText);
      }
    };

    const handleKeyDown = (e) => {
      // Auto-paste on Ctrl+V
      if (e.ctrlKey && e.key === 'v') {
        navigator.clipboard.readText().then(text => {
          if (isReadyPlayerMeUrl(text)) {
            setModelUrl(text);
          }
        }).catch(() => {});
      }
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleAutoUpload = async () => {
    if (!modelUrl.trim()) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelUrl: modelUrl.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (onUploadSuccess) {
          onUploadSuccess(data);
        }
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modelUrl.trim()) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelUrl: modelUrl.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (onUploadSuccess) {
          onUploadSuccess(data);
        }
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Auto-Upload 3D Model URLs to Cloudinary</h3>
      <p className="text-sm text-gray-600 mb-4">
        Just paste any Ready Player Me URL and it will automatically upload to Cloudinary!
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="modelUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Ready Player Me GLB URL (Auto-upload enabled):
          </label>
          <input
            type="url"
            id="modelUrl"
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
            placeholder="https://models.readyplayer.me/68e6b414eb5a8fd6a7a953e4.glb"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
          {autoDetected && (
            <p className="mt-1 text-sm text-green-600">
              ✓ Ready Player Me URL detected - uploading automatically...
            </p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isUploading || !modelUrl.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload to Cloudinary'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Hide upload result details section as requested */}
    </div>
  );
}
