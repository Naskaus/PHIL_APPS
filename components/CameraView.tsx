import React, { useRef, useEffect, useCallback, useState } from 'react';
import { CameraIcon } from './icons';

interface CameraViewProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    setCameraError(null);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Error accessing camera:", err);
        setCameraError("Could not access camera. Please check permissions and ensure your device is not using it elsewhere.");
      });

    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const handleCapture = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `receipt-manual-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  }, [onCapture]);
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-view-title"
    >
        <h2 id="camera-view-title" className="sr-only">Camera View</h2>
        {cameraError ? (
            <div className="text-white text-center p-8">
                <p className="text-lg font-semibold">Camera Error</p>
                <p className="mt-2">{cameraError}</p>
                <button
                    onClick={onClose}
                    className="mt-6 px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200"
                >
                    Close
                </button>
            </div>
        ) : (
            <>
                <div className="w-full h-full flex items-center justify-center p-4">
                    <video ref={videoRef} autoPlay playsInline muted className="max-w-full max-h-full object-contain" aria-label="Camera feed"></video>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent">
                   <div className="flex items-center justify-center w-full max-w-xs gap-4">
                      <button
                          type="button"
                          onClick={onClose}
                          className="px-6 py-2 text-white font-semibold rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black transition-all"
                          aria-label="Cancel camera"
                      >
                          Cancel
                      </button>
                      <button
                          type="button"
                          onClick={handleCapture}
                          className="w-20 h-20 bg-white text-indigo-600 rounded-full border-4 border-white/50 shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black hover:bg-slate-100 transition"
                          aria-label="Capture photo"
                      >
                          <CameraIcon className="w-10 h-10"/>
                      </button>
                      <div className="w-[88px]"></div> {/* Spacer to balance the cancel button */}
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default CameraView;
