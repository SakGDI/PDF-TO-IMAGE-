import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  FileUp, 
  Download, 
  Trash2, 
  Image as ImageIcon, 
  Loader2, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Maximize2, 
  Plus, 
  Files, 
  Clock, 
  Menu, 
  X, 
  Settings2, 
  CheckSquare, 
  Square, 
  Filter, 
  ArrowRight, 
  Monitor, 
  Globe,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Github,
  User
} from 'lucide-react';
import { ConversionStatus, ConvertedPage, PDFMetadata, ExportFormat, AIAnalysis, PDFProject } from './types';
import { loadPDF, convertPageToImage } from './services/pdfService';
import { analyzePDFContent } from './services/geminiService';

type Language = 'en' | 'km';

const translations = {
  en: {
    welcome: "Welcome to Y.C PDF",
    uploadTitle: "Upload your PDFs",
    uploadDesc: "Fast PDF to high-res images. No size limits.",
    browseFiles: "Browse Files",
    filesQueue: "Files Queue",
    addMore: "Add More PDFs",
    convertQueue: "Convert Queue",
    winEdition: "Win Edition",
    winOptimized: "Windows Optimized",
    explorerFriendly: "Explorer-Friendly Naming",
    convertAll: "Convert All",
    convertSelected: "Convert Selected",
    zipAll: "Zip All",
    zipSelected: "Zip Selection",
    resolution: "Resolution",
    gallery: "Gallery",
    analysis: "Analysis",
    pageRange: "Page range (e.g. 1-5, 10, 15-20)",
    select: "Select",
    selectAll: "Select All",
    clear: "Clear",
    notRendered: "Not Rendered",
    ready: "Ready",
    pending: "Pending",
    error: "Error",
    selected: "SELECTED",
    abstract: "Abstract",
    keyTakeaways: "Key Takeaways",
    footer: "100% Client-Side • Secure • High Fidelity",
    pages: "PAGES",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    resetZoom: "Reset",
    credit: "Created by @Sakada_Noeurn"
  },
  km: {
    welcome: "សូមស្វាគមន៏មកកាន Y.C PDF",
    uploadTitle: "ដាក់ឯកសារ PDF របស់អ្នក",
    uploadDesc: "បំប្លែង PDF ទៅជារូបភាពច្បាស់ៗ។ មិនកំណត់ទំហំ។",
    browseFiles: "ជ្រើសរើសឯកសារ",
    filesQueue: "បញ្ជីឯកសារ",
    addMore: "បន្ថែម PDF ទៀត",
    convertQueue: "បំប្លែងទាំងអស់",
    winEdition: "កំណែសម្រាប់ Windows",
    winOptimized: "Windows Optimized",
    explorerFriendly: "ដាក់ឈ្មោះសម្រាប់ Windows",
    convertAll: "បំប្លែងទាំងអស់",
    convertSelected: "បំប្លែងដែលបានរើស",
    zipAll: "ទាញយក ZIP ទាំងអស់",
    zipSelected: "ទាញយក ZIP ដែលរើស",
    resolution: "កម្រិតរូបភាព",
    gallery: "រូបភាព",
    analysis: "ការវិភាគ AI",
    pageRange: "ចន្លោះទំព័រ (ឧទាហរណ៍ 1-5, 10)",
    select: "ជ្រើសរើស",
    selectAll: "រើសទាំងអស់",
    clear: "សម្អាត",
    notRendered: "មិនទាន់បំប្លែង",
    ready: "រួចរាល់",
    pending: "កំពុងរង់ចាំ",
    error: "មានបញ្ហា",
    selected: "បានជ្រើសរើស",
    abstract: "សេចក្តីសង្ខេប",
    keyTakeaways: "ចំណុចសំខាន់ៗ",
    footer: "សុវត្ថិភាព ១០០% • មិនមានការផ្ញើឯកសារទៅខាងក្រៅ",
    pages: "ទំព័រ",
    zoomIn: "ពង្រីក",
    zoomOut: "បង្រួម",
    resetZoom: "ដើមវិញ",
    credit: "បង្កើតដោយ @Sakada_Noeurn"
  }
};

const TypewriterText: React.FC<{ lang: Language }> = ({ lang }) => {
  const fullText = translations[lang].welcome;
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);
  const typingSpeed = 150;
  const deletingSpeed = 75;
  const pauseTime = 2000;

  useEffect(() => {
    setDisplayedText("");
    setIndex(0);
    setIsDeleting(false);
  }, [lang]);

  useEffect(() => {
    let timer: number;

    if (!isDeleting && index < fullText.length) {
      timer = window.setTimeout(() => {
        setDisplayedText(prev => prev + fullText[index]);
        setIndex(prev => prev + 1);
      }, typingSpeed);
    } else if (isDeleting && index > 0) {
      timer = window.setTimeout(() => {
        setDisplayedText(prev => prev.slice(0, -1));
        setIndex(prev => prev - 1);
      }, deletingSpeed);
    } else if (!isDeleting && index === fullText.length) {
      timer = window.setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && index === 0) {
      setIsDeleting(false);
      timer = window.setTimeout(() => {}, 500);
    }

    return () => clearTimeout(timer);
  }, [index, isDeleting, fullText]);

  return (
    <div className="h-12 sm:h-24 flex items-center justify-center overflow-hidden px-4">
      <span className={`${lang === 'km' ? 'font-bayon' : 'font-black'} text-2xl sm:text-5xl lg:text-6xl text-slate-800 tracking-wide typewriter-cursor pr-1 text-center`}>
        {displayedText}
      </span>
    </div>
  );
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('km');
  const [projects, setProjects] = useState<PDFProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [dpi, setDpi] = useState<number>(300); 
  const [activeTab, setActiveTab] = useState<'gallery' | 'ai'>('gallery');
  const [selectedPreview, setSelectedPreview] = useState<ConvertedPage | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [isWindows, setIsWindows] = useState(false);
  const [useWindowsNaming, setUseWindowsNaming] = useState(true);

  const t = translations[language];
  const pdfRefs = useRef<Map<string, any>>(new Map());

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId), 
    [projects, activeProjectId]
  );

  useEffect(() => {
    const platform = window.navigator.userAgent.toLowerCase();
    if (platform.includes('win')) {
      setIsWindows(true);
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const parseRange = (input: string, max: number): number[] => {
    const result = new Set<number>();
    const parts = input.split(',').map(p => p.trim());
    
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(max, end); i++) {
            result.add(i);
          }
        }
      } else {
        const num = Number(part);
        if (!isNaN(num) && num >= 1 && num <= max) {
          result.add(num);
        }
      }
    });
    
    return Array.from(result).sort((a, b) => a - b);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      if (file.type !== 'application/pdf') continue;
      
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const placeholder: PDFProject = {
        id,
        file,
        metadata: { name: file.name, size: file.size, totalPages: 0 },
        status: ConversionStatus.LOADING,
        pages: [],
        selectedPages: [],
        progress: 0,
        aiAnalysis: null,
        error: null
      };
      
      setProjects(prev => [...prev, placeholder]);

      try {
        const { pdf, metadata } = await loadPDF(file);
        pdfRefs.current.set(id, pdf);
        
        setProjects(prev => prev.map(p => p.id === id ? { 
          ...p, 
          metadata, 
          status: ConversionStatus.IDLE 
        } : p));

        if (!activeProjectId) setActiveProjectId(id);
      } catch (err) {
        setProjects(prev => prev.map(p => p.id === id ? { 
          ...p, 
          status: ConversionStatus.ERROR, 
          error: "Failed to load PDF." 
        } : p));
      }
    }
  };

  const removeProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    pdfRefs.current.delete(id);
    if (activeProjectId === id) {
      const remaining = projects.filter(p => p.id !== id);
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const convertProject = async (projectId: string, targetPages?: number[]) => {
    const project = projects.find(p => p.id === projectId);
    const pdf = pdfRefs.current.get(projectId);
    if (!project || !pdf) return;

    const total = project.metadata.totalPages;
    const pagesToConvert = targetPages || Array.from({ length: total }, (_, i) => i + 1);

    setProjects(prev => prev.map(p => p.id === projectId ? { 
      ...p, 
      status: ConversionStatus.CONVERTING, 
      progress: 0
    } : p));

    const scale = dpi / 72;
    let completedCount = 0;
    
    try {
      for (const pageNum of pagesToConvert) {
        const exists = project.pages.find(pg => pg.pageNumber === pageNum);
        if (exists) {
          completedCount++;
          continue;
        }

        const page = await convertPageToImage(pdf, pageNum, scale, exportFormat);
        
        setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            const newPages = [...p.pages, page].sort((a, b) => a.pageNumber - b.pageNumber);
            return {
              ...p,
              pages: newPages,
              progress: Math.round(((++completedCount) / pagesToConvert.length) * 100)
            };
          }
          return p;
        }));

        if (pageNum === 1 && !project.aiAnalysis) {
          analyzePDFContent(page.dataUrl)
            .then(analysis => {
              setProjects(prev => prev.map(p => p.id === projectId ? { ...p, aiAnalysis: analysis } : p));
            })
            .catch(err => console.error("AI Analysis failed", err));
        }
      }

      setProjects(prev => prev.map(p => p.id === projectId ? { 
        ...p, 
        status: ConversionStatus.COMPLETED 
      } : p));
    } catch (err) {
      setProjects(prev => prev.map(p => p.id === projectId ? { 
        ...p, 
        status: ConversionStatus.ERROR, 
        error: "Conversion failed." 
      } : p));
    }
  };

  const convertAll = async () => {
    setIsProcessingAll(true);
    const pending = projects.filter(p => p.status === ConversionStatus.IDLE || p.status === ConversionStatus.COMPLETED);
    for (const p of pending) {
      await convertProject(p.id);
    }
    setIsProcessingAll(false);
  };

  const togglePageSelection = (projectId: string, pageNumber: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const isSelected = p.selectedPages.includes(pageNumber);
        return {
          ...p,
          selectedPages: isSelected 
            ? p.selectedPages.filter(num => num !== pageNumber)
            : [...p.selectedPages, pageNumber].sort((a, b) => a - b)
        };
      }
      return p;
    }));
  };

  const applyRangeSelection = () => {
    if (!activeProject || !rangeInput) return;
    const selected = parseRange(rangeInput, activeProject.metadata.totalPages);
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, selectedPages: selected } : p));
  };

  const downloadProjectZip = async (project: PDFProject, onlySelected: boolean = false) => {
    // @ts-ignore
    const zip = new JSZip();
    const folderName = project.metadata.name.replace('.pdf', '') + "_images";
    const folder = zip.folder(folderName);
    
    const pagesToZip = onlySelected 
      ? project.pages.filter(pg => project.selectedPages.includes(pg.pageNumber))
      : project.pages;

    if (pagesToZip.length === 0) return;

    pagesToZip.forEach((page) => {
      const base64Data = page.dataUrl.split(',')[1];
      const paddingCount = project.metadata.totalPages.toString().length;
      const pageName = useWindowsNaming 
        ? `Page_${page.pageNumber.toString().padStart(paddingCount, '0')}.${exportFormat}`
        : `page_${page.pageNumber}.${exportFormat}`;
        
      folder.file(pageName, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${project.metadata.name.replace('.pdf', '')}_${onlySelected ? 'selection_' : ''}${dpi}dpi.zip`;
    link.click();
  };

  const downloadImage = (page: ConvertedPage) => {
    const link = document.createElement('a');
    link.href = page.dataUrl;
    const paddingCount = activeProject?.metadata.totalPages.toString().length || 3;
    const fileName = useWindowsNaming 
      ? `Page_${page.pageNumber.toString().padStart(paddingCount, '0')}_${dpi}dpi.${exportFormat}`
      : `page_${page.pageNumber}_${dpi}dpi.${exportFormat}`;
    link.download = fileName;
    link.click();
  };

  const selectAllPages = () => {
    if (!activeProject) return;
    const all = Array.from({ length: activeProject.metadata.totalPages }, (_, i) => i + 1);
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, selectedPages: all } : p));
  };

  const clearSelection = () => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, selectedPages: [] } : p));
    setRangeInput('');
  };

  const handleOpenPreview = (page: ConvertedPage) => {
    setSelectedPreview(page);
    setPreviewZoom(1);
  };

  const fontBodyClass = language === 'km' ? 'font-battambang' : 'font-sans';
  const fontHeadingClass = language === 'km' ? 'font-bayon' : 'font-black';

  return (
    <div className={`flex h-screen bg-slate-50 overflow-hidden ${fontBodyClass} font-transition relative`}>
      {isSidebarOpen && projects.length > 0 && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 flex flex-col shadow-xl lg:shadow-sm z-40 transition-transform duration-300 lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${projects.length === 0 ? 'hidden' : ''}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Files className="w-5 h-5 text-indigo-600" />
            <h2 className={`font-bold text-slate-800 ${language === 'km' ? 'font-bayon text-lg' : ''}`}>{t.filesQueue}</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProjectId(p.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all relative group ${
                activeProjectId === p.id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className={`p-2 rounded-xl shrink-0 ${activeProjectId === p.id ? 'bg-white' : 'bg-slate-50'}`}>
                  <FileText className={`w-4 h-4 ${activeProjectId === p.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${activeProjectId === p.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {p.metadata.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    {p.metadata.totalPages || '?'} {t.pages} • {(p.metadata.size / (1024 * 1024)).toFixed(1)}MB
                  </p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeProject(p.id); }}
                  className="lg:opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {p.status === ConversionStatus.CONVERTING && (
                <div className="w-full h-1 bg-indigo-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${p.progress}%` }}></div>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                 {p.status === ConversionStatus.COMPLETED ? (
                   <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" /> {t.ready}
                   </div>
                 ) : p.status === ConversionStatus.CONVERTING ? (
                   <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                      <Loader2 className="w-3 h-3 animate-spin" /> {p.progress}%
                   </div>
                 ) : p.status === ConversionStatus.ERROR ? (
                   <div className="flex items-center gap-1 text-[10px] font-bold text-red-600">
                      <AlertCircle className="w-3 h-3" /> {t.error}
                   </div>
                 ) : (
                   <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Clock className="w-3 h-3" /> {t.pending}
                   </div>
                 )}
                 {p.selectedPages.length > 0 && (
                    <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-black">
                      {p.selectedPages.length} {t.selected}
                    </span>
                 )}
              </div>
            </button>
          ))}
          
          <label className="block w-full cursor-pointer group">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
              <Plus className="w-6 h-6 text-slate-300 group-hover:text-indigo-400" />
              <span className={`text-xs font-bold text-slate-400 group-hover:text-indigo-500 ${language === 'km' ? 'font-battambang' : ''}`}>{t.addMore}</span>
            </div>
            <input type="file" multiple className="hidden" accept="application/pdf" onChange={handleFileChange} />
          </label>
        </div>

        {isWindows && (
          <div className="p-4 border-t border-slate-100 bg-indigo-50/20">
            <div className="flex items-center gap-2 mb-2">
               <Monitor className="w-4 h-4 text-indigo-600" />
               <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">{t.winOptimized}</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer group">
               <input 
                 type="checkbox" 
                 checked={useWindowsNaming} 
                 onChange={(e) => setUseWindowsNaming(e.target.checked)}
                 className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" 
               />
               <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">{t.explorerFriendly}</span>
            </label>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
           <button
             onClick={convertAll}
             disabled={isProcessingAll || projects.length === 0}
             className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
           >
             {isProcessingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
             <span className={language === 'km' ? 'font-battambang' : ''}>{t.convertQueue}</span>
           </button>
           
           <div className="flex flex-col items-center gap-1.5 opacity-60">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <User className="w-3 h-3" /> {t.credit}
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-2 sm:px-4 lg:px-8 shrink-0 z-20 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
             {projects.length > 0 && (
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
               >
                 <Menu className="w-5 h-5" />
               </button>
             )}
             <button 
               onClick={() => setActiveProjectId(null)}
               className="flex items-center gap-2 sm:gap-3 shrink-0 hover:opacity-70 transition-opacity active:scale-95 group"
             >
               <div className="bg-indigo-600 p-1 rounded-lg shadow-lg shadow-indigo-100 hidden xs:block group-hover:bg-indigo-500 overflow-hidden">
                  <img src="logo.png" alt="Logo" className="w-5 h-5 sm:w-6 sm:h-6 object-cover" />
               </div>
               <div className="flex flex-col min-w-0 text-left">
                 <h1 className="text-sm sm:text-lg lg:text-xl font-black text-slate-900 tracking-tight leading-none whitespace-nowrap uppercase">Y.C PDF</h1>
                 {isWindows && <span className="text-[7px] sm:text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 truncate">{t.winEdition}</span>}
               </div>
             </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4 ml-auto">
            <div className="flex items-center bg-slate-50 rounded-full p-0.5 sm:p-1 border border-slate-200 shadow-inner shrink-0 scale-90 sm:scale-100 origin-right">
               <button 
                 onClick={() => setLanguage('km')}
                 className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black transition-all flex items-center gap-1 ${language === 'km' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 KM
               </button>
               <button 
                 onClick={() => setLanguage('en')}
                 className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black transition-all flex items-center gap-1 ${language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 EN
               </button>
            </div>

            {activeProject && (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                 {activeProject.status !== ConversionStatus.CONVERTING && (
                   <button
                     onClick={() => convertProject(activeProject.id, activeProject.selectedPages.length > 0 ? activeProject.selectedPages : undefined)}
                     className="bg-indigo-600 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-sm shadow-md hover:bg-indigo-700 active:scale-95 transition-all whitespace-nowrap"
                   >
                     {activeProject.selectedPages.length > 0 ? (
                       <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 hidden xs:block" /> {activeProject.selectedPages.length}</span>
                     ) : (
                       <span className={language === 'km' ? 'font-battambang' : ''}>{language === 'km' ? 'បំប្លែង' : 'Convert'}</span>
                     )}
                   </button>
                 )}
                 
                 {activeProject.pages.length > 0 && (
                   <button
                     onClick={() => downloadProjectZip(activeProject, activeProject.selectedPages.length > 0)}
                     className="bg-emerald-600 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-sm shadow-md hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap"
                   >
                     <Download className="w-3.5 h-3.5" /> <span className={`hidden sm:inline ${language === 'km' ? 'font-battambang' : ''}`}>{t.zipAll}</span>
                   </button>
                 )}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!activeProject ? (
            <div className="h-full flex flex-col items-center justify-center p-4 lg:p-8">
               <div className="max-w-4xl w-full text-center mb-8">
                  <TypewriterText lang={language} />
               </div>
               <div className="max-w-xl w-full">
                  <label className="block w-full group cursor-pointer">
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-20 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-500 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          <img src="logo.png" alt="Logo BG" className="w-48 h-48 grayscale" />
                       </div>
                       <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-full flex items-center justify-center mb-4 sm:mb-8 group-hover:scale-110 transition-transform duration-500 ring-8 ring-indigo-50/50 shadow-2xl border-4 border-slate-50 overflow-hidden">
                          <img src="logo.png" alt="Branding" className="w-full h-full object-cover" />
                       </div>
                       <h2 className={`text-lg sm:text-3xl font-black text-slate-800 mb-2 sm:mb-3 ${language === 'km' ? 'font-bayon' : ''}`}>{t.uploadTitle}</h2>
                       <p className={`text-slate-400 text-xs sm:text-base font-medium mb-4 sm:mb-8 leading-relaxed max-w-xs mx-auto ${language === 'km' ? 'font-battambang' : ''}`}>{t.uploadDesc}</p>
                       <div className="bg-indigo-600 text-white px-6 sm:px-10 py-2.5 sm:py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 group-hover:shadow-indigo-200 transition-all text-xs sm:text-base">
                          {t.browseFiles}
                       </div>
                    </div>
                    <input type="file" multiple className="hidden" accept="application/pdf" onChange={handleFileChange} />
                  </label>
               </div>
               <div className="mt-8 flex flex-col items-center gap-2">
                 <div className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-center px-4">
                   {t.footer}
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm text-[9px] font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                    <User className="w-3 h-3" /> {t.credit}
                 </div>
               </div>
            </div>
          ) : (
            <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-4 sm:mb-8">
                <div className="lg:col-span-2 bg-white rounded-3xl sm:rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-8 flex items-center gap-4 sm:gap-5">
                   <div className="bg-indigo-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
                      <FileText className="text-indigo-600 w-6 h-6 sm:w-8 sm:h-8" />
                   </div>
                   <div className="min-w-0">
                      <h2 className="text-sm sm:text-2xl font-black text-slate-800 leading-tight truncate pr-2">{activeProject.metadata.name}</h2>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 font-bold mt-1 uppercase">
                         <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{activeProject.metadata.totalPages} {t.pages}</span>
                         <span className="w-1 h-1 bg-slate-200 rounded-full hidden sm:block"></span>
                         <span>{(activeProject.metadata.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-3xl sm:rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-5 sm:p-8 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2 text-indigo-600">
                        <Settings2 className="w-4 h-4" />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${language === 'km' ? 'font-bayon' : ''}`}>{t.resolution}</span>
                     </div>
                     <span className="text-indigo-600 font-black text-sm">{dpi} DPI</span>
                  </div>
                  
                  <input 
                    type="range" min="72" max="300" step="1"
                    value={dpi} 
                    onChange={(e) => setDpi(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  
                  <div className="flex justify-between mt-3">
                    {[72, 150, 300].map(val => (
                      <button 
                        key={val}
                        onClick={() => setDpi(val)}
                        className={`text-[10px] font-black px-2 py-1 rounded transition-all ${dpi === val ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selection & Range Controls */}
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/30 border border-slate-100 p-4 sm:p-6 mb-4 sm:mb-8 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full relative">
                   <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Filter className="w-4 h-4 text-slate-300" />
                   </div>
                   <input 
                     type="text"
                     placeholder={t.pageRange}
                     value={rangeInput}
                     onChange={(e) => setRangeInput(e.target.value)}
                     className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                   />
                   <button 
                    onClick={applyRangeSelection}
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-indigo-600 text-white px-3 sm:px-4 rounded-xl text-[10px] sm:text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                   >
                     {t.select} <ArrowRight className="w-3 h-3" />
                   </button>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto overflow-x-auto no-scrollbar">
                   <button 
                     onClick={selectAllPages}
                     className="px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 rounded-2xl text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 whitespace-nowrap"
                   >
                      <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t.selectAll}
                   </button>
                   <button 
                     onClick={clearSelection}
                     disabled={activeProject.selectedPages.length === 0}
                     className="px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 rounded-2xl text-[10px] sm:text-xs font-bold text-slate-400 hover:text-red-500 disabled:opacity-30 transition-all whitespace-nowrap"
                   >
                      {t.clear}
                   </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mb-8">
                 <div className="px-4 sm:px-8 py-3 sm:py-6 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/10">
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                        <button 
                          onClick={() => setActiveTab('gallery')}
                          className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'gallery' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                          <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t.gallery}
                        </button>
                        {activeProject.aiAnalysis && (
                          <button 
                            onClick={() => setActiveTab('ai')}
                            className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'ai' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'}`}
                          >
                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t.analysis}
                          </button>
                        )}
                    </div>

                    {activeProject.status === ConversionStatus.CONVERTING && (
                      <div className="flex items-center gap-3 w-full md:w-64">
                         <div className="flex-1 h-1.5 bg-indigo-50 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${activeProject.progress}%` }}></div>
                         </div>
                         <span className="text-[10px] font-black text-indigo-600 whitespace-nowrap">{activeProject.progress}%</span>
                      </div>
                    )}
                 </div>

                 <div className="p-4 sm:p-8 min-h-[300px] sm:min-h-[400px]">
                    {activeTab === 'gallery' ? (
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                        {Array.from({ length: activeProject.metadata.totalPages }, (_, i) => i + 1).map((pageNum) => {
                          const page = activeProject.pages.find(pg => pg.pageNumber === pageNum);
                          const isSelected = activeProject.selectedPages.includes(pageNum);
                          
                          return (
                            <div key={pageNum} className={`group flex flex-col bg-white rounded-2xl sm:rounded-3xl border transition-all duration-500 overflow-hidden relative ${isSelected ? 'border-indigo-400 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-200 shadow-sm hover:shadow-xl'}`}>
                              <div className="aspect-[3/4] relative overflow-hidden bg-slate-50 border-b border-slate-50">
                                {page ? (
                                  <>
                                    <img src={page.dataUrl} className="w-full h-full object-contain p-2 transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-center justify-center gap-2 sm:gap-3">
                                      <button onClick={() => handleOpenPreview(page)} className="bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"><Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-800" /></button>
                                      <button onClick={() => downloadImage(page)} className="bg-indigo-600 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all text-white"><Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                     <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 opacity-20 mb-2" />
                                     <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40">{t.notRendered}</span>
                                  </div>
                                )}
                                
                                <button 
                                  onClick={() => togglePageSelection(activeProject.id, pageNum)}
                                  className={`absolute top-3 left-3 sm:top-4 sm:left-4 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white/90 text-slate-300 hover:text-indigo-400 lg:opacity-0 group-hover:opacity-100'}`}
                                >
                                   {isSelected ? <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                </button>
                              </div>
                              <div className="p-3 sm:p-4 flex items-center justify-between">
                                 <span className={`text-[10px] sm:text-sm font-black transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>PAGE {pageNum}</span>
                                 {page && <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase">{page.width}x{page.height} PX</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="max-w-4xl mx-auto py-4 sm:py-8">
                         {activeProject.aiAnalysis ? (
                           <div className="bg-white p-6 sm:p-12 rounded-3xl sm:rounded-[3rem] border border-slate-100 shadow-2xl relative overflow-hidden">
                              <div className="relative z-10">
                                 <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-4 sm:mb-8">
                                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t.analysis}
                                 </div>
                                 <h2 className={`text-lg sm:text-4xl font-black text-slate-900 mb-4 sm:mb-6 leading-tight ${language === 'km' ? 'font-bayon' : ''}`}>{activeProject.aiAnalysis.suggestedTitle}</h2>
                                 <div className="space-y-8 sm:space-y-12 mt-6 sm:mt-12">
                                    <section>
                                       <h4 className={`text-[9px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-3 sm:mb-4 border-l-4 border-indigo-500 pl-3 sm:pl-4 ${language === 'km' ? 'font-bayon' : ''}`}>{t.abstract}</h4>
                                       <p className={`text-slate-600 leading-relaxed text-sm sm:text-2xl font-medium italic ${language === 'km' ? 'font-battambang' : ''}`}>"{activeProject.aiAnalysis.summary}"</p>
                                    </section>
                                    <section>
                                       <h4 className={`text-[9px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 sm:mb-6 border-l-4 border-indigo-500 pl-3 sm:pl-4 ${language === 'km' ? 'font-bayon' : ''}`}>{t.keyTakeaways}</h4>
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                          {activeProject.aiAnalysis.keyPoints.map((p, i) => (
                                             <div key={i} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                                                <div className="bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm border border-slate-50 shrink-0 mt-0.5">
                                                   <CheckCircle2 className="w-4 h-4 sm:w-5 h-5 text-emerald-500" />
                                                </div>
                                                <span className={`text-slate-700 font-bold text-xs sm:text-base leading-snug ${language === 'km' ? 'font-battambang' : ''}`}>{p}</span>
                                             </div>
                                          ))}
                                       </div>
                                    </section>
                                 </div>
                              </div>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center py-20 sm:py-40 text-center">
                              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-200 animate-pulse mb-6" />
                              <p className={`text-slate-400 font-bold text-sm sm:text-xl uppercase tracking-widest px-4 ${language === 'km' ? 'font-bayon' : ''}`}>AI analysis requires Page 1 conversion...</p>
                           </div>
                         )}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedPreview && (
        <div className="fixed inset-0 z-[100] bg-slate-900/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-500">
           <div className="flex items-center justify-between p-4 sm:p-8 text-white">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                 <span className="bg-indigo-600 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shrink-0">Page {selectedPreview.pageNumber}</span>
                 <p className="font-bold opacity-60 text-[10px] sm:text-sm truncate max-w-[150px] sm:max-w-xs">{activeProject?.metadata.name}</p>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 bg-white/10 rounded-2xl p-1">
                 <button 
                   onClick={() => setPreviewZoom(prev => Math.max(0.2, prev - 0.2))}
                   className="p-2 sm:p-3 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all"
                   title={t.zoomOut}
                 >
                    <ZoomOut className="w-5 h-5" />
                 </button>
                 <div className="px-2 min-w-[50px] text-center text-[10px] sm:text-xs font-black">
                   {Math.round(previewZoom * 100)}%
                 </div>
                 <button 
                   onClick={() => setPreviewZoom(prev => Math.min(3, prev + 0.2))}
                   className="p-2 sm:p-3 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all"
                   title={t.zoomIn}
                 >
                    <ZoomIn className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={() => setPreviewZoom(1)}
                   className="p-2 sm:p-3 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all"
                   title={t.resetZoom}
                 >
                    <RotateCcw className="w-5 h-5" />
                 </button>
              </div>

              <button onClick={() => setSelectedPreview(null)} className="bg-white/10 hover:bg-white/20 p-2 sm:p-3 rounded-full transition-all shrink-0">
                 <X className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
           </div>
           
           <div className="flex-1 overflow-auto p-4 sm:p-12 flex items-center justify-center cursor-move select-none">
              <div 
                className="transition-transform duration-300 ease-out flex items-center justify-center origin-center"
                style={{ transform: `scale(${previewZoom})` }}
              >
                <img 
                  src={selectedPreview.dataUrl} 
                  className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded bg-white"
                  draggable={false}
                />
              </div>
           </div>
           
           <div className="p-4 sm:p-8 flex justify-center">
              <button 
                onClick={() => downloadImage(selectedPreview)}
                className="bg-indigo-600 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 sm:gap-3 text-xs sm:text-base"
              >
                <Download className="w-5 h-5 sm:w-6 sm:h-6" /> {language === 'km' ? 'ទាញយក' : 'Download'} {dpi} DPI
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;