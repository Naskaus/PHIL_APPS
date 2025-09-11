import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UploadIcon, CameraIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  processing: boolean;
  selectedFile: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, processing, selectedFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (selectedFile) {
      setIsCameraOpen(false); // If a file is selected (e.g., from camera), close camera view
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isCameraOpen) {
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
          setCameraError("Could not access camera. Please check permissions.");
          setIsCameraOpen(false);
        });
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isCameraOpen, stopCameraStream]);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };

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
            const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onFileSelect(file);
          }
          setIsCameraOpen(false);
        }, 'image/jpeg', 0.95);
      }
    }
  }, [onFileSelect]);

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!processing) setIsDragging(true);
  }, [processing]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!processing) {
      handleFileChange(e.dataTransfer.files);
    }
  }, [processing]);

  const baseClasses = "border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-all duration-300 ease-in-out cursor-pointer";
  const idleClasses = "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50";
  const draggingClasses = "border-indigo-500 bg-indigo-100 ring-2 ring-indigo-300";
  const disabledClasses = "bg-slate-100 border-slate-200 cursor-not-allowed";
  
  if (isCameraOpen) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="bg-slate-900 rounded-xl overflow-hidden relative shadow-lg">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-[60vh] object-contain" aria-label="Camera feed"></video>
        </div>
         <div className="flex items-center justify-center gap-4">
           <button
              type="button"
              onClick={() => setIsCameraOpen(false)}
              className="px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all"
              aria-label="Cancel camera"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCapture}
              className="w-16 h-16 bg-indigo-600 text-white rounded-full border-4 border-white shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-indigo-700 transition"
              aria-label="Capture photo"
            >
              <CameraIcon className="w-8 h-8"/>
            </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files)}
        accept="image/*,.pdf"
        disabled={processing}
      />
      
      {!previewUrl ? (
        <div className="space-y-4">
            <label htmlFor="file-upload">
              <div
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={`${baseClasses} ${processing ? disabledClasses : isDragging ? draggingClasses : idleClasses}`}
              >
                <UploadIcon className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-slate-600 font-semibold">
                  <span className="text-indigo-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-slate-500 mt-1">PNG, JPG, or PDF</p>
              </div>
            </label>
            
            <div className="flex items-center my-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 font-medium text-sm">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="text-center">
                <button
                    onClick={() => setIsCameraOpen(true)}
                    disabled={processing}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CameraIcon className="w-5 h-5" /> Use Camera
                </button>
            </div>
            {cameraError && <p className="text-center text-red-600 mt-2 text-sm">{cameraError}</p>}
        </div>
      ) : (
        <div className="relative group">
          <img src={previewUrl} alt="Receipt preview" className="w-full max-h-80 object-contain rounded-lg border border-slate-200" />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <button
              onClick={() => onFileSelect(null)}
              className="px-4 py-2 bg-white text-slate-800 font-semibold rounded-lg shadow-md hover:bg-slate-100"
            >
              Change File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;