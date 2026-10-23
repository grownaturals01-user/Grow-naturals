import React, { useState, useRef, useEffect } from 'react';
import { LandscapingProject, ProjectDocument } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import {
  Camera,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  X,
  RefreshCw,
  Sliders,
  Sparkles,
  Download,
  Calendar,
  Layers,
  Image as ImageIcon,
  HardHat,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

interface ConstructionPhasePhotosProps {
  project: LandscapingProject;
  onClose?: () => void;
  isModal?: boolean;
}

type PhaseType = 'Before' | 'During' | 'After';

export const ConstructionPhasePhotos: React.FC<ConstructionPhasePhotosProps> = ({
  project,
  onClose,
  isModal = false,
}) => {
  const { addProjectDocument, deleteProjectDocument } = useProjects();
  const allDocs = project.documents || [];

  // Filter photos
  const sitePhotos = allDocs.filter(d => d.category === 'Site Photo' || d.mimeType?.startsWith('image/'));

  // Active filter
  const [activeFilter, setActiveFilter] = useState<'all' | PhaseType | 'comparison'>('all');
  const [selectedPhotoForLightbox, setSelectedPhotoForLightbox] = useState<ProjectDocument | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhase, setCapturedPhase] = useState<PhaseType>('During');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoNotes, setPhotoNotes] = useState('');
  const [uploadedBy, setUploadedBy] = useState(
    project.step4Planning.supervisorName || 'Site Supervisor'
  );

  // Video and Canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Before vs After Slider State
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100%
  const beforePhotos = sitePhotos.filter(p => p.phase === 'Before');
  const afterPhotos = sitePhotos.filter(p => p.phase === 'After');
  const duringPhotos = sitePhotos.filter(p => p.phase === 'During');

  const [selectedBeforePhoto, setSelectedBeforePhoto] = useState<ProjectDocument | null>(
    beforePhotos[0] || sitePhotos[0] || null
  );
  const [selectedAfterPhoto, setSelectedAfterPhoto] = useState<ProjectDocument | null>(
    afterPhotos[0] || sitePhotos[sitePhotos.length - 1] || null
  );

  // Initialize or stop camera stream
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    setIsCameraActive(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported on this browser or environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        err.message || 'Unable to access camera. Please allow camera permissions or upload photos from device.'
      );
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture Photo with Timestamp Watermark
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Overlay Watermark Banner (Date, Time, Project Code)
    const now = new Date();
    const dateStr = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const timestampTag = `${dateStr} ${timeStr}`;

    // Semi-transparent bottom watermark banner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, canvas.height - 48, canvas.width, 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`TERRAFLOW • ${project.code} • Phase: ${capturedPhase.toUpperCase()}`, 20, canvas.height - 24);

    ctx.fillStyle = '#34d399'; // Emerald-400
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Timestamp: ${timestampTag}`, canvas.width - 20, canvas.height - 24);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // Add to project documents
    const title = photoTitle.trim() || `${capturedPhase} Phase Site Photo (${timestampTag})`;

    addProjectDocument(project.id, {
      title,
      category: 'Site Photo',
      type: 'file',
      fileName: `SitePhoto_${capturedPhase}_${Date.now()}.jpg`,
      fileSize: '1.2 MB',
      mimeType: 'image/jpeg',
      url: dataUrl,
      uploadedBy: uploadedBy.trim() || 'Site Supervisor',
      notes: photoNotes.trim() || `Field capture during ${capturedPhase} construction phase.`,
      phase: capturedPhase,
      timestamp: timestampTag,
    });

    // Reset and flash
    stopCamera();
    setPhotoTitle('');
    setPhotoNotes('');
  };

  // Fallback Upload from File Picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const resultUrl = event.target?.result as string;
      const now = new Date();
      const dateStr = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const timestampTag = `${dateStr} ${timeStr}`;

      addProjectDocument(project.id, {
        title: photoTitle.trim() || `${capturedPhase}: ${file.name.replace(/\.[^/.]+$/, '')}`,
        category: 'Site Photo',
        type: 'file',
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        mimeType: file.type || 'image/jpeg',
        url: resultUrl,
        uploadedBy: uploadedBy.trim() || 'Site Supervisor',
        notes: photoNotes.trim() || `Uploaded photo for ${capturedPhase} phase.`,
        phase: capturedPhase,
        timestamp: timestampTag,
      });

      setPhotoTitle('');
      setPhotoNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const filteredPhotos = sitePhotos.filter(p => {
    if (activeFilter === 'all') return true;
    return p.phase === activeFilter;
  });

  return (
    <div className={`space-y-6 ${isModal ? 'p-6 bg-white' : ''}`}>
      {/* Top Header */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                  Construction Phase Photo Tracker & Camera
                </h2>
                <span className="text-[11px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                  {sitePhotos.length} site photos
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Capture live timestamped photos directly from mobile/tablet camera, automatically organized by Before, During, and After construction phases.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={() => startCamera()}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>Launch Camera</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Close Camera</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-xl transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-neutral-500" />
              <span>Upload Photo</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Phase Breakdown Counters */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-neutral-100 text-xs">
          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between">
            <span className="text-neutral-600 font-medium text-[11px]">Before (Site Survey)</span>
            <span className="font-bold text-neutral-900 bg-neutral-200/80 px-2 py-0.5 rounded-full text-[11px]">
              {beforePhotos.length}
            </span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
            <span className="text-amber-900 font-medium text-[11px]">During (Execution)</span>
            <span className="font-bold text-amber-950 bg-amber-200 px-2 py-0.5 rounded-full text-[11px]">
              {duringPhotos.length}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
            <span className="text-emerald-900 font-medium text-[11px]">After (Completed Handover)</span>
            <span className="font-bold text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
              {afterPhotos.length}
            </span>
          </div>
        </div>
      </div>

      {/* Live Camera Viewfinder Modal / Section */}
      {isCameraActive && (
        <div className="bg-neutral-950 rounded-2xl p-4 text-white shadow-xl space-y-4 border border-neutral-800 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-bold">Live Site Camera Viewfinder</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = cameraFacing === 'environment' ? 'user' : 'environment';
                  setCameraFacing(next);
                  startCamera(next);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-200 text-xs"
                title="Switch front/back camera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch Camera</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Preview Container */}
          <div className="relative aspect-video max-h-[420px] mx-auto bg-black rounded-xl overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Live Watermark Overlay Preview */}
            <div className="absolute bottom-0 inset-x-0 bg-black/65 px-4 py-2 flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-200">
                {project.code} • Phase: <strong className="text-emerald-400">{capturedPhase}</strong>
              </span>
              <span className="text-emerald-400 text-[11px]">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
            <div>
              <label className="font-medium text-neutral-400 block mb-1">Assign Construction Phase:</label>
              <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1 rounded-xl">
                {(['Before', 'During', 'After'] as PhaseType[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCapturedPhase(p)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      capturedPhase === p
                        ? 'bg-emerald-600 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-medium text-neutral-400 block mb-1">Photo Caption (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Kadappa stepping stones dry lay test"
                value={photoTitle}
                onChange={e => setPhotoTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="w-full py-2.5 px-4 font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Snap & Save Timestamped Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Error Message with upload prompt */}
      {cameraError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg whitespace-nowrap"
          >
            Upload from Files
          </button>
        </div>
      )}

      {/* Filter Tabs & Views */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All Photos ({sitePhotos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('Before')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'Before'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            1. Before ({beforePhotos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('During')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'During'
                ? 'bg-amber-800 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            2. During Execution ({duringPhotos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('After')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'After'
                ? 'bg-emerald-800 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            3. After Handover ({afterPhotos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('comparison')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'comparison'
                ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Before vs After Slider</span>
          </button>
        </div>
      </div>

      {/* VIEW A: Before vs After Split Comparison Slider */}
      {activeFilter === 'comparison' ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Interactive Before vs. After Transformation Comparison</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Drag the slider left or right to showcase the landscape transformation from barren site to lush completed garden.
              </p>
            </div>

            {/* Selectors for comparison photos */}
            <div className="flex items-center gap-2 text-xs">
              <div>
                <select
                  value={selectedBeforePhoto?.id || ''}
                  onChange={e => setSelectedBeforePhoto(beforePhotos.find(p => p.id === e.target.value) || null)}
                  className="px-2.5 py-1 text-xs border border-neutral-300 rounded-lg bg-neutral-50 font-medium"
                >
                  {beforePhotos.map(p => (
                    <option key={p.id} value={p.id}>Before: {p.title.substring(0, 25)}...</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={selectedAfterPhoto?.id || ''}
                  onChange={e => setSelectedAfterPhoto(afterPhotos.find(p => p.id === e.target.value) || null)}
                  className="px-2.5 py-1 text-xs border border-neutral-300 rounded-lg bg-neutral-50 font-medium"
                >
                  {afterPhotos.map(p => (
                    <option key={p.id} value={p.id}>After: {p.title.substring(0, 25)}...</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedBeforePhoto && selectedAfterPhoto ? (
            <div className="relative aspect-16/10 max-h-[500px] w-full mx-auto rounded-2xl overflow-hidden select-none border border-neutral-200 shadow-md">
              {/* After Photo (Bottom Layer) */}
              <img
                src={selectedAfterPhoto.url}
                alt="After landscape"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Before Photo (Clipped Top Layer) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={selectedBeforePhoto.url}
                  alt="Before landscape"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{ width: '100%', height: '100%' }}
                />
                <div className="absolute top-4 left-4 bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Before Transformation
                </div>
              </div>

              {/* After label */}
              <div className="absolute top-4 right-4 bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                After Completion
              </div>

              {/* Slider Divider Bar */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-xl cursor-ew-resize flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-white text-neutral-800 shadow-2xl flex items-center justify-center font-bold text-xs -ml-3.5 border-2 border-emerald-700">
                  <Sliders className="w-4 h-4 text-emerald-800" />
                </div>
              </div>

              {/* Range Input controller */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={e => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl">
              Please ensure at least one 'Before' photo and one 'After' photo are captured to activate the comparison slider.
            </div>
          )}
        </div>
      ) : (
        /* VIEW B: Photo Grid Gallery */
        filteredPhotos.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center space-y-3">
            <ImageIcon className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-800">No photos in this phase category</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Launch the camera or upload photos from your device to timestamp and record site progress.
            </p>
            <button
              type="button"
              onClick={() => startCamera()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Take Photo</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPhotos.map(photo => {
              const photoPhase = photo.phase || 'During';

              return (
                <div
                  key={photo.id}
                  className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col"
                >
                  {/* Photo Thumbnail */}
                  <div
                    className="relative aspect-4/3 bg-neutral-100 cursor-pointer overflow-hidden"
                    onClick={() => setSelectedPhotoForLightbox(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />

                    {/* Phase Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs ${
                          photoPhase === 'Before'
                            ? 'bg-neutral-900/85 text-white'
                            : photoPhase === 'After'
                            ? 'bg-emerald-700/90 text-white'
                            : 'bg-amber-600/90 text-white'
                        }`}
                      >
                        {photoPhase}
                      </span>
                    </div>

                    {/* Timestamp Overlay */}
                    {photo.timestamp && (
                      <div className="absolute bottom-2 left-2 right-2 bg-black/65 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-white font-mono flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>{photo.timestamp}</span>
                        </span>
                        <Maximize2 className="w-3 h-3 opacity-75" />
                      </div>
                    )}
                  </div>

                  {/* Photo Details */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{photo.title}</h4>
                      {photo.notes && (
                        <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                          {photo.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[10px] text-neutral-400">
                      <span>👤 {photo.uploadedBy || 'Supervisor'}</span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={photo.url}
                          download={photo.fileName || 'SitePhoto.jpg'}
                          className="p-1 text-neutral-500 hover:text-neutral-800 transition-colors"
                          title="Download photo"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => deleteProjectDocument(project.id, photo.id)}
                          className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Lightbox Modal */}
      {selectedPhotoForLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative max-w-4xl w-full bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 text-white">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{selectedPhotoForLightbox.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-100">
                  {selectedPhotoForLightbox.phase || 'Site Photo'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoForLightbox(null)}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] flex items-center justify-center bg-black">
              <img
                src={selectedPhotoForLightbox.url}
                alt={selectedPhotoForLightbox.title}
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="p-4 bg-neutral-900 border-t border-neutral-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-neutral-400">
              <div>
                <p className="text-white font-medium">{selectedPhotoForLightbox.notes}</p>
                <div className="text-[11px] mt-1 flex items-center gap-3">
                  <span>📅 Timestamp: {selectedPhotoForLightbox.timestamp || selectedPhotoForLightbox.uploadedAt}</span>
                  <span>•</span>
                  <span>👤 Captured by: {selectedPhotoForLightbox.uploadedBy}</span>
                </div>
              </div>

              <a
                href={selectedPhotoForLightbox.url}
                download={selectedPhotoForLightbox.fileName || 'SitePhoto.jpg'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-semibold transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save High-Res</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
