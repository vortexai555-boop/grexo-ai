import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Globe, FileCode2, FileText, Monitor, Tablet, Smartphone, Download, Copy, Maximize2, Minimize2, Play, Square, ArrowLeft, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import api from "@/lib/api";

export default function WebsiteEditor({ 
  project, 
  onBack, 
  onUpdateFiles, 
  onChat 
}) {
  const [activeFile, setActiveFile] = useState("preview");
  const [viewMode, setViewMode] = useState("desktop");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [files, setFiles] = useState(project?.files || { html: "", css: "", js: "" });
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(project?.name || "");

  useEffect(() => {
    if (project?.files) setFiles(project.files);
    if (project?.name) setEditName(project.name);
  }, [project]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (JSON.stringify(files) !== JSON.stringify(project?.files)) {
        onUpdateFiles(project.id, files);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [files, project?.id, project?.files, onUpdateFiles]);

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    try {
      await api.put(`/website/${project.id}`, { name: editName.trim() });
      toast.success("Project renamed");
      setIsEditingName(false);
      if (project) project.name = editName.trim();
    } catch (err) {
      toast.error("Failed to rename project");
    }
  };

  const handleCopy = () => {
    if (files && files["html"]) {
      const fullHtml = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<style>${files["css"]}</style>\n<script src="https://cdn.tailwindcss.com" crossorigin="anonymous"></script>\n</head>\n<body>\n${files["html"]}\n<script>${files["js"]}</script>\n</body>\n</html>`;
      navigator.clipboard.writeText(fullHtml);
      toast.success("Source code copied to clipboard!");
    }
  };

  const downloadZip = async () => {
    if (!files) return;
    const zip = new JSZip();
    zip.file("index.html", files["html"] || "");
    zip.file("styles.css", files["css"] || "");
    zip.file("script.js", files["js"] || "");
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${project?.name || 'website'}.zip`);
  };

  const handleChat = async () => {
    if (!chatInput.trim() || isChatting) return;
    setIsChatting(true);
    try {
      await onChat(project.id, chatInput.trim());
      setChatInput("");
    } finally {
      setIsChatting(false);
    }
  };

  const safeJs = (files && files["js"]) ? files["js"].replace(/<\/script>/gi, '<\\/script>') : "";
  const srcDoc = files ? `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8" />\n<script>window.onerror = function(msg) { if(msg==='Script error.') return true; }; window.addEventListener('error', function(e) { if(e.message==='Script error.') { e.preventDefault(); e.stopImmediatePropagation(); } }, true);</script>\n<style>${files["css"] || ""}</style>\n<script src="https://cdn.tailwindcss.com" crossorigin="anonymous"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>\n<script>\n  setTimeout(() => {\n    if (window.html2canvas) {\n      window.html2canvas(document.body, { scale: 0.5, useCORS: true }).then(canvas => {\n        window.parent.postMessage({ type: 'THUMBNAIL', data: canvas.toDataURL('image/jpeg', 0.5) }, '*');\n      }).catch(e => console.error(e));\n    }\n  }, 2000);\n</script>\n</head>\n<body>\n${files["html"] || ""}\n<script>try { ${safeJs} } catch(e) {}</script>\n</body>\n</html>` : "";
  const widthClass = isFullScreen ? "w-full" : viewMode === "mobile" ? "w-[375px]" : viewMode === "tablet" ? "w-[768px]" : "w-full";

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'THUMBNAIL' && event.data.data) {
        if (project && project.thumbnail_url !== event.data.data) {
          api.put(`/website/${project.id}`, { thumbnail_url: event.data.data }).catch(console.error);
          project.thumbnail_url = event.data.data;
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [project]);

  return (
    <div className={`flex flex-col text-gray-200 overflow-hidden ${isFullScreen ? 'fixed inset-0 z-[100] bg-[#07080d]' : 'h-full bg-transparent p-6 lg:p-10'}`}>
      
      {!isFullScreen && (
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-400 hover:text-white rounded-full">
              <ArrowLeft size={20} />
            </Button>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="h-8 bg-[#0d0e12] border-white/10 text-white w-64"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:text-green-300" onClick={handleSaveName}>
                  <Check size={16} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                <h1 className="text-2xl font-medium tracking-tight text-white">
                  {project?.name || "Untitled Project"}
                </h1>
                <Edit2 size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500 font-mono">ID: {project?.id}</div>
        </div>
      )}

      <div className={`flex flex-1 min-h-0 ${isFullScreen ? '' : ''}`}>
        {/* Sidebar */}
        {!isFullScreen && (
          <div className="w-80 shrink-0 border border-white/10 bg-[#0d0e12] rounded-l-2xl flex flex-col h-full z-10 transition-all shadow-xl shadow-black/20 overflow-hidden">
            
            <div className="p-4 border-b border-white/5 flex flex-col gap-3 bg-[#111216]">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">AI Assistant</div>
              <Textarea 
                placeholder="Ask AI to modify this website..." 
                className="w-full h-28 bg-[#07080A] text-gray-200 border-white/10 focus-visible:ring-cyan-500 resize-none rounded-xl text-sm"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={isChatting}
              />
              <Button onClick={handleChat} disabled={!chatInput.trim() || isChatting} className="w-full h-10 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all font-medium">
                {isChatting ? "Generating Edit..." : "Apply AI Edit"}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
              <div className="px-3 pt-3 pb-2 text-[10px] uppercase tracking-widest text-[#4B5563] font-bold">Workspace</div>
              
              <button onClick={() => setActiveFile("preview")} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left w-full font-medium tracking-tight ${activeFile === "preview" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner" : "hover:bg-white/5 text-slate-400 border border-transparent"}`}>
                <Monitor size={16} className={activeFile === "preview" ? "text-cyan-400" : "text-slate-500"} /> Live Preview
              </button>

              <div className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-widest text-[#4B5563] font-bold">Source Code</div>
              
              {[
                { id: "html", icon: FileCode2 },
                { id: "css", icon: Globe },
                { id: "js", icon: FileText }
              ].map(f => (
                <button key={f.id} onClick={() => setActiveFile(f.id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left w-full font-medium tracking-tight ${activeFile === f.id ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner" : "hover:bg-white/5 text-slate-400 border border-transparent"}`}>
                  <f.icon size={16} className={activeFile === f.id ? "text-cyan-400" : "text-slate-500"} /> {f.id === 'html' ? 'index.html' : f.id === 'css' ? 'styles.css' : 'script.js'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Area */}
        <div className={`flex flex-col min-w-0 flex-1 relative ${isFullScreen ? 'h-full bg-[#07080d]' : 'border-y border-r border-white/10 rounded-r-2xl overflow-hidden bg-[#0a0a0f] shadow-2xl relative shadow-black/40'}`}>
          
          <div className={`h-14 border-b border-white/10 bg-[#111216]/90 backdrop-blur flex items-center justify-between px-5 shrink-0 z-20 ${isFullScreen ? 'absolute top-0 w-full left-0 right-0' : ''}`}>
            
            {/* Viewport Toggles */}
            <div className={`flex bg-black/40 rounded-lg border border-white/5 p-1`}>
              {["desktop", "tablet", "mobile"].map(mode => {
                const Icon = mode === "desktop" ? Monitor : mode === "tablet" ? Tablet : Smartphone;
                return (
                  <button key={mode} onClick={() => setViewMode(mode)} title={mode} className={`p-1.5 rounded-md transition-all ${viewMode === mode ? "bg-[#1f2334] text-cyan-400 shadow-sm border border-white/5" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}>
                    <Icon size={16} />
                  </button>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {isChatting && <div className="text-xs text-cyan-400 mr-3 animate-pulse">AI is editing...</div>}
              <Button size="sm" variant="ghost" onClick={handleCopy} className="text-slate-400 hover:text-white h-8 hover:bg-white/5 px-2.5" title="Copy HTML/CSS/JS">
                <Copy size={16} />
                <span className="hidden sm:inline ml-2 text-xs font-medium tracking-wide">Copy Code</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={downloadZip} className="text-slate-400 hover:text-white h-8 hover:bg-white/5 px-2.5" title="Download Source (.zip)">
                <Download size={16} />
                <span className="hidden sm:inline ml-2 text-xs font-medium tracking-wide">Download ZIP</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsFullScreen(!isFullScreen)} className={`${isFullScreen ? 'text-cyan-400 hover:text-cyan-300 bg-cyan-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'} h-8 px-2.5 ml-1`} title="Toggle Full Screen">
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131722] via-[#0a0a0f] to-[#0a0a0f]">
            {activeFile === "preview" ? (
              <AnimatePresence mode="wait">
                <motion.div key="preview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className={`absolute inset-0 w-full h-full flex items-center justify-center ${isFullScreen ? 'p-0 pt-14' : 'p-4 pb-0 opacity-100'}`}>
                  <div className={`h-full bg-white shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${widthClass} ${viewMode !== 'desktop' && !isFullScreen ? 'rounded-[2rem] border-[10px] border-[#1f2334] mb-4 origin-bottom shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/10' : 'rounded-t-xl mb-0 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.5)]'}`}>
                    <iframe title="live-preview" srcDoc={srcDoc} className="w-full h-full border-0 bg-white" sandbox="allow-scripts allow-same-origin allow-forms" />
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="absolute inset-0 pt-2 bg-[#1e1e1e]">
                <textarea
                  className="w-full h-full bg-[#1e1e1e] text-white p-4 font-mono text-sm resize-none outline-none"
                  value={files[activeFile] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFiles(f => ({ ...f, [activeFile]: val }));
                  }}
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
