import React, { useState, useRef } from 'react';
import { LandscapingProject, ProjectDocument } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import {
  Paperclip,
  Upload,
  Link2,
  FileText,
  Image as ImageIcon,
  Map,
  ShieldCheck,
  Droplets,
  Receipt,
  Search,
  Trash2,
  ExternalLink,
  Eye,
  Plus,
  Check,
  Copy,
  FolderOpen,
  Filter,
  Grid,
  List as ListIcon,
  X,
  FileCheck,
  Calendar,
  User,
  Sparkles,
  Download,
} from 'lucide-react';

interface ProjectDocumentsSectionProps {
  project: LandscapingProject;
  initialOpenModal?: boolean;
  onCloseModal?: () => void;
  isModalView?: boolean;
}

type CategoryFilter = 'all' | ProjectDocument['category'];

const CATEGORIES: Array<ProjectDocument['category']> = [
  'Site Plan',
  'Contract',
  'Site Photo',
  'Soil/Water Report',
  'Irrigation Scheme',
  'Invoice / Receipt',
  'Other',
];

const PRESET_SAMPLE_DOCS: Array<Omit<ProjectDocument, 'id' | 'uploadedAt'>> = [
  {
    title: 'Master CAD Plot Plan & Hardscape Details',
    category: 'Site Plan',
    type: 'file',
    fileName: 'Cadastral_Master_Landscape_Plan_v2.dwg',
    fileSize: '4.6 MB',
    mimeType: 'application/octet-stream',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    uploadedBy: 'Senior Landscape Architect',
    notes: 'Approved architectural drawings with levels, boundary offsets, and hardscape paving.',
  },
  {
    title: 'Signed Client Landscaping Work Order & Scope Contract',
    category: 'Contract',
    type: 'file',
    fileName: 'Landscaping_Agreement_Signed.pdf',
    fileSize: '1.9 MB',
    mimeType: 'application/pdf',
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
    uploadedBy: 'Project Management Office',
    notes: 'Signed contract detailing scope of work, milestone payments, and plant warranty.',
  },
  {
    title: 'Pre-work Site Topography & Existing Soil Photo',
    category: 'Site Photo',
    type: 'file',
    fileName: 'Site_Condition_Before_Excavation.jpg',
    fileSize: '3.2 MB',
    mimeType: 'image/jpeg',
    url: 'https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=1200&q=80',
    uploadedBy: 'Site Surveyor',
    notes: 'Pre-construction inspection photograph taken during initial site visit.',
  },
  {
    title: 'Soil pH, Organic Carbon & Water TDS Lab Report',
    category: 'Soil/Water Report',
    type: 'file',
    fileName: 'Soil_Water_Agronomy_Lab_Certificate.pdf',
    fileSize: '740 KB',
    mimeType: 'application/pdf',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    uploadedBy: 'Horticulture Agronomist',
    notes: 'pH 6.8, TDS 360ppm. Recommended 2 inches sand bed and vermicompost enrichment.',
  },
  {
    title: 'Cloud BIM & 3D Irrigation Hydraulic Map Link',
    category: 'Irrigation Scheme',
    type: 'link',
    url: 'https://drive.google.com/drive/folders/terraflow-cad-drawings',
    uploadedBy: 'Irrigation Lead',
    notes: 'Interactive cloud folder containing pop-up valve layouts and pipe sizing diagrams.',
  },
];

export const ProjectDocumentsSection: React.FC<ProjectDocumentsSectionProps> = ({
  project,
  isModalView = false,
  onCloseModal,
}) => {
  const { addProjectDocument, deleteProjectDocument, updateProjectDocument } = useProjects();
  const documents = project.documents || [];

  // Filter & View State
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Attachment Modal / Tab State
  const [showAddModal, setShowAddModal] = useState(false);
  const [attachType, setAttachType] = useState<'upload' | 'link'>('upload');
  const [isDragging, setIsDragging] = useState(false);

  // Form State for Adding Document
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<ProjectDocument['category']>('Site Plan');
  const [docLinkUrl, setDocLinkUrl] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docUploadedBy, setDocUploadedBy] = useState(
    project.step4Planning.supervisorName || project.step1Enquiry.clientName || 'Landscape Architect'
  );

  // File Upload specifics
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preview / Details Modal State
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper for category icon and colors
  const getCategoryMeta = (category: ProjectDocument['category']) => {
    switch (category) {
      case 'Site Plan':
        return {
          icon: <Map className="w-3.5 h-3.5" />,
          colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
          badgeClass: 'bg-blue-100 text-blue-800',
        };
      case 'Contract':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          badgeClass: 'bg-emerald-100 text-emerald-900 font-semibold',
        };
      case 'Site Photo':
        return {
          icon: <ImageIcon className="w-3.5 h-3.5" />,
          colorClass: 'bg-violet-50 text-violet-700 border-violet-200',
          badgeClass: 'bg-violet-100 text-violet-800',
        };
      case 'Soil/Water Report':
        return {
          icon: <Droplets className="w-3.5 h-3.5" />,
          colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
          badgeClass: 'bg-amber-100 text-amber-900',
        };
      case 'Irrigation Scheme':
        return {
          icon: <FileText className="w-3.5 h-3.5" />,
          colorClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
          badgeClass: 'bg-cyan-100 text-cyan-900',
        };
      case 'Invoice / Receipt':
        return {
          icon: <Receipt className="w-3.5 h-3.5" />,
          colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
          badgeClass: 'bg-rose-100 text-rose-800',
        };
      default:
        return {
          icon: <FileCheck className="w-3.5 h-3.5" />,
          colorClass: 'bg-neutral-50 text-neutral-700 border-neutral-200',
          badgeClass: 'bg-neutral-100 text-neutral-800',
        };
    }
  };

  // Format File Size
  const formatFileSize = (bytes?: number | string): string => {
    if (!bytes) return '1.2 MB';
    if (typeof bytes === 'string') return bytes;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Process File Selection
  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    if (!docTitle.trim()) {
      // Create readable title from file name without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setDocTitle(cleanName);
    }

    // Auto-detect category from file name or type
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('plan') || lowerName.includes('cad') || lowerName.includes('layout') || lowerName.includes('dwg')) {
      setDocCategory('Site Plan');
    } else if (lowerName.includes('contract') || lowerName.includes('agreement') || lowerName.includes('order')) {
      setDocCategory('Contract');
    } else if (file.type.startsWith('image/') || lowerName.includes('photo') || lowerName.includes('pic') || lowerName.includes('site')) {
      setDocCategory('Site Photo');
    } else if (lowerName.includes('soil') || lowerName.includes('water') || lowerName.includes('tds')) {
      setDocCategory('Soil/Water Report');
    } else if (lowerName.includes('irrigation') || lowerName.includes('sprinkler') || lowerName.includes('drip')) {
      setDocCategory('Irrigation Scheme');
    } else if (lowerName.includes('invoice') || lowerName.includes('bill') || lowerName.includes('receipt')) {
      setDocCategory('Invoice / Receipt');
    }

    // Read Data URL for preview if image or general preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target?.result) {
          setFilePreviewUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Non-image file (e.g. PDF or DWG)
      setFilePreviewUrl('');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Reset form
  const resetForm = () => {
    setDocTitle('');
    setDocCategory('Site Plan');
    setDocLinkUrl('');
    setDocNotes('');
    setSelectedFile(null);
    setFilePreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowAddModal(false);
  };

  // Save new Document
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();

    if (attachType === 'upload') {
      if (!selectedFile && !docTitle.trim()) {
        alert('Please select a file or enter a document title.');
        return;
      }

      // Generate a realistic file URL or use the data URL from FileReader
      const fileUrl =
        filePreviewUrl ||
        (selectedFile?.type.startsWith('image/')
          ? 'https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=1200&q=80'
          : docCategory === 'Contract'
          ? 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80');

      const newDoc: Omit<ProjectDocument, 'id' | 'uploadedAt'> = {
        title: docTitle.trim() || selectedFile?.name || 'Attached Project Document',
        category: docCategory,
        type: 'file',
        fileName: selectedFile?.name || `${docTitle.replace(/\s+/g, '_')}.pdf`,
        fileSize: formatFileSize(selectedFile?.size),
        mimeType: selectedFile?.type || 'application/pdf',
        url: fileUrl,
        uploadedBy: docUploadedBy.trim() || 'Landscape Architect',
        notes: docNotes.trim(),
      };

      addProjectDocument(project.id, newDoc);
      showNotification(`"${newDoc.title}" successfully uploaded and attached to project.`);
      resetForm();
    } else {
      // Link Type
      if (!docLinkUrl.trim()) {
        alert('Please enter a valid document or cloud URL.');
        return;
      }

      const newDoc: Omit<ProjectDocument, 'id' | 'uploadedAt'> = {
        title: docTitle.trim() || 'Cloud Document Reference',
        category: docCategory,
        type: 'link',
        url: docLinkUrl.trim(),
        uploadedBy: docUploadedBy.trim() || 'Landscape Architect',
        notes: docNotes.trim(),
      };

      addProjectDocument(project.id, newDoc);
      showNotification(`"${newDoc.title}" link attached to project.`);
      resetForm();
    }
  };

  // Quick Add Sample
  const handleAddSample = (sample: typeof PRESET_SAMPLE_DOCS[0]) => {
    addProjectDocument(project.id, sample);
    showNotification(`Sample "${sample.title}" attached.`);
  };

  // Copy Link to clipboard
  const handleCopyLink = (doc: ProjectDocument) => {
    navigator.clipboard.writeText(doc.url);
    setCopiedDocId(doc.id);
    showNotification(`Link copied to clipboard!`);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  // Filtered Documents
  const filteredDocs = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.fileName && doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.uploadedBy && doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Category counts
  const categoryCounts = documents.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`space-y-5 ${isModalView ? '' : 'bg-white border border-neutral-200 rounded-xl p-5 shadow-xs'}`}>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium animate-fade-in">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Paperclip className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <span>Site Plans, Contracts & Attachments</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {documents.length} {documents.length === 1 ? 'file' : 'files'}
                </span>
              </h3>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Store and review CAD drawings, signed client contracts, soil/water lab certificates, and progress photographs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Preset Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Sample Docs</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg p-2 z-30 hidden group-hover:block text-xs space-y-1">
              <div className="font-semibold text-neutral-700 px-2 py-1 text-[11px] uppercase tracking-wider">
                Instant Landscape Samples:
              </div>
              {PRESET_SAMPLE_DOCS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddSample(sample)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-neutral-100 flex items-center justify-between gap-2 text-neutral-800 text-[11px]"
                >
                  <span className="truncate">{sample.title}</span>
                  <span className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-500 shrink-0">
                    {sample.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Link CTA */}
          <button
            onClick={() => {
              setAttachType('link');
              setShowAddModal(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5 text-neutral-600" />
            <span>Add Link</span>
          </button>

          {/* Upload File CTA */}
          <button
            onClick={() => {
              setAttachType('upload');
              setShowAddModal(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          {isModalView && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 ml-1"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All Files ({documents.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-800 text-white font-semibold'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCategory === cat ? 'bg-emerald-950 text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search input & View mode */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search plans, contracts..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg w-48 sm:w-56 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-neutral-50/50"
            />
          </div>

          <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-500'}`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-500'}`}
              title="Table View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredDocs.length === 0 ? (
        <div className="bg-neutral-50/80 border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900">
              {searchTerm || selectedCategory !== 'all' ? 'No matching documents found' : 'No documents attached yet'}
            </h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              Attach architectural CAD site plans, executed client agreements, soil lab test results, or site photos to
              keep all project assets in one place.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setAttachType('upload');
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={() => handleAddSample(PRESET_SAMPLE_DOCS[0])}
              className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Load Sample Site Plan</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => {
            const meta = getCategoryMeta(doc.category);
            const isImage = doc.mimeType?.startsWith('image/') || doc.fileName?.match(/\.(jpg|jpeg|png|webp|svg)$/i);

            return (
              <div
                key={doc.id}
                className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl overflow-hidden transition-all duration-150 flex flex-col group shadow-xs"
              >
                {/* Visual Thumbnail or Icon Header */}
                <div
                  onClick={() => setPreviewDoc(doc)}
                  className="h-32 bg-neutral-100 relative cursor-pointer overflow-hidden border-b border-neutral-100 flex items-center justify-center group-hover:opacity-95"
                >
                  {isImage && doc.url ? (
                    <img
                      src={doc.url}
                      alt={doc.title}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-50 to-neutral-100">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-neutral-700 mb-2">
                        {meta.icon}
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-neutral-500 uppercase tracking-wider">
                        {doc.fileName ? doc.fileName.split('.').pop() || 'DOC' : 'LINK'}
                      </span>
                    </div>
                  )}

                  {/* Category Badge overlay */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs ${meta.badgeClass}`}
                    >
                      {meta.icon}
                      <span>{doc.category}</span>
                    </span>
                  </div>

                  {/* Type Badge (File / Link) */}
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-semibold bg-neutral-900/75 text-white backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                      {doc.type === 'link' ? <Link2 className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
                      <span>{doc.type === 'link' ? 'Cloud Link' : doc.fileSize || 'File'}</span>
                    </span>
                  </div>

                  {/* Hover Quick Action */}
                  <div className="absolute inset-0 bg-neutral-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-white/95 text-neutral-900 text-xs font-bold flex items-center gap-1 shadow-md">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </span>
                  </div>
                </div>

                {/* Card Details Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4
                      onClick={() => setPreviewDoc(doc)}
                      className="text-xs font-bold text-neutral-900 line-clamp-1 hover:text-emerald-800 cursor-pointer"
                      title={doc.title}
                    >
                      {doc.title}
                    </h4>

                    {doc.fileName && (
                      <p className="text-[11px] font-mono text-neutral-500 truncate mt-0.5" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                    )}

                    {doc.notes && (
                      <p className="text-[11px] text-neutral-600 line-clamp-2 mt-1.5 leading-relaxed bg-neutral-50 p-1.5 rounded border border-neutral-100">
                        {doc.notes}
                      </p>
                    )}
                  </div>

                  {/* Metadata and Actions footer */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>{doc.uploadedAt}</span>
                      {doc.uploadedBy && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[90px]">{doc.uploadedBy}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyLink(doc)}
                        className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded"
                        title={copiedDocId === doc.id ? 'Copied!' : 'Copy link'}
                      >
                        {copiedDocId === doc.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-neutral-400 hover:text-emerald-700 hover:bg-neutral-100 rounded"
                        title="Open file or link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => {
                          if (confirm(`Remove "${doc.title}" from project documents?`)) {
                            deleteProjectDocument(project.id, doc.id);
                            showNotification(`Document removed.`);
                          }
                        }}
                        className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded"
                        title="Delete document"
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
      ) : (
        /* Table View */
        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="py-2.5 px-4">Document / File</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Type / Size</th>
                <th className="py-2.5 px-3">Uploaded By</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredDocs.map(doc => {
                const meta = getCategoryMeta(doc.category);
                return (
                  <tr key={doc.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="font-bold text-neutral-900 hover:text-emerald-800 text-left truncate block max-w-xs"
                          >
                            {doc.title}
                          </button>
                          {doc.fileName && (
                            <div className="text-[11px] font-mono text-neutral-400 truncate">{doc.fileName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${meta.badgeClass}`}>
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 font-mono text-[11px]">
                      {doc.type === 'link' ? 'Cloud Link' : doc.fileSize || 'File'}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 truncate max-w-[120px]">
                      {doc.uploadedBy || 'Landscape Architect'}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-500 tabular-nums">{doc.uploadedAt}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1 text-neutral-500 hover:text-emerald-800 hover:bg-neutral-100 rounded"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded"
                          title="Open Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${doc.title}"?`)) {
                              deleteProjectDocument(project.id, doc.id);
                              showNotification(`Document removed.`);
                            }
                          }}
                          className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload File / Add Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-neutral-200 shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  {attachType === 'upload' ? <Upload className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    {attachType === 'upload' ? 'Upload Project File or Photo' : 'Attach External Document Link'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Attach site plans, contracts, photos, or cloud URLs to {project.code}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attach Type Switcher Tabs */}
            <div className="px-6 pt-4 flex gap-2 border-b border-neutral-100 pb-3">
              <button
                type="button"
                onClick={() => setAttachType('upload')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  attachType === 'upload'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Local File Upload (.pdf, .jpg, .cad)</span>
              </button>
              <button
                type="button"
                onClick={() => setAttachType('link')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  attachType === 'link'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>External Link (Drive, BIM, CAD)</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDocument} className="p-6 space-y-4">
              {attachType === 'upload' ? (
                /* Drag & Drop File Zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : selectedFile
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                    accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.webp,.svg,.doc,.docx,.xlsx"
                  />

                  {selectedFile ? (
                    <div className="space-y-2">
                      {filePreviewUrl ? (
                        <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden border border-neutral-200 shadow-xs">
                          <img src={filePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <FileCheck className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-neutral-900 block truncate">{selectedFile.name}</span>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {formatFileSize(selectedFile.size)} · Click to change file
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="w-10 h-10 mx-auto rounded-full bg-neutral-200/70 text-neutral-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-semibold text-neutral-800">
                        Click to browse or drag & drop files here
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Site Plans (PDF, DWG), Contracts (PDF, DOC), Photos (JPG, PNG) up to 25 MB
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* External Link Input */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">
                    Document or Cloud URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/... or https://onedrive.live.com/..."
                      value={docLinkUrl}
                      onChange={e => setDocLinkUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    Paste Google Drive, Dropbox, BIM 360, or Figma shared link
                  </p>
                </div>
              )}

              {/* Title & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">
                    Document Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Landscape CAD Layout Rev C"
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={docCategory}
                    onChange={e => setDocCategory(e.target.value as ProjectDocument['category'])}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Uploaded By */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">Uploaded By / Author</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Karthik Raja (Senior Architect)"
                    value={docUploadedBy}
                    onChange={e => setDocUploadedBy(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Notes / Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">Notes / Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved plot boundary, includes 1,800 sq.ft lawn turf zone and CAD layer coordinates..."
                  value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{attachType === 'upload' ? 'Upload & Save Document' : 'Attach Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview & Details Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-neutral-200 shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                  {getCategoryMeta(previewDoc.category).icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 truncate max-w-md">{previewDoc.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <span className="font-semibold text-emerald-800">{previewDoc.category}</span>
                    <span>·</span>
                    <span>{previewDoc.type === 'link' ? 'External Link' : previewDoc.fileSize || 'File'}</span>
                    <span>·</span>
                    <span>Uploaded {previewDoc.uploadedAt}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* If Image: Full Image Viewer */}
              {previewDoc.mimeType?.startsWith('image/') ||
              previewDoc.fileName?.match(/\.(jpg|jpeg|png|webp|svg)$/i) ? (
                <div className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-950 flex items-center justify-center max-h-96">
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.title}
                    className="max-h-96 max-w-full object-contain mx-auto"
                  />
                </div>
              ) : (
                /* Non-image Document Display Box */
                <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-emerald-800">
                    {getCategoryMeta(previewDoc.category).icon}
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900">{previewDoc.title}</h4>
                  {previewDoc.fileName && (
                    <div className="text-xs font-mono text-neutral-500 bg-white px-2.5 py-1 rounded border border-neutral-200">
                      {previewDoc.fileName} ({previewDoc.fileSize || 'Standard'})
                    </div>
                  )}
                  <p className="text-xs text-neutral-500 max-w-md">
                    This file is stored as a project asset. You can view or download the original file directly below.
                  </p>
                </div>
              )}

              {/* Metadata Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-100">
                <div>
                  <span className="text-[11px] text-neutral-400 block font-medium">Category</span>
                  <span className="font-bold text-neutral-900">{previewDoc.category}</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block font-medium">Type</span>
                  <span className="font-bold text-neutral-900">
                    {previewDoc.type === 'link' ? 'Cloud Link' : 'Stored File'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block font-medium">Uploaded By</span>
                  <span className="font-medium text-neutral-900">{previewDoc.uploadedBy || 'Operations Team'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block font-medium">Upload Date</span>
                  <span className="font-medium text-neutral-900">{previewDoc.uploadedAt}</span>
                </div>
              </div>

              {previewDoc.notes && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-neutral-700 block">Notes & Scope Context:</span>
                  <p className="text-xs text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-200 leading-relaxed">
                    {previewDoc.notes}
                  </p>
                </div>
              )}

              {/* URL Reference Bar */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-neutral-700 block">Resource URL:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={previewDoc.url}
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-600 truncate"
                  />
                  <button
                    onClick={() => handleCopyLink(previewDoc)}
                    className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center gap-1"
                  >
                    {copiedDocId === previewDoc.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-3.5 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
              <button
                onClick={() => {
                  if (confirm(`Delete "${previewDoc.title}"?`)) {
                    deleteProjectDocument(project.id, previewDoc.id);
                    setPreviewDoc(null);
                    showNotification('Document deleted.');
                  }
                }}
                className="text-xs font-medium text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Document</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 rounded-lg"
                >
                  Close
                </button>
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Resource</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
