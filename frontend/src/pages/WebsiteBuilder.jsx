import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Code2, Play, Download, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function WebsiteBuilder() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState(null);
  const [activeTab, setActiveTab] = useState("preview");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setFiles(null);
    try {
      const fullMessage = `Build a modern, fully responsive web application. Requirements: ${prompt}.
Use Tailwind CSS via CDN in the HTML. Feel free to use modern JavaScript or third-party libraries via CDN (e.g., React via UMD, D3, framer-motion, lucide) if needed to fulfill the requirements.
CRITICAL INSTRUCTION: You MUST return the complete, production-ready source code for 'index.html', 'styles.css', and 'script.js'. You MUST wrap each file's content in an XML block with the exact filename, like this:
<file name="index.html">
<!DOCTYPE html>
<html>...</html>
</file>
<file name="styles.css">
/* css here */
</file>
<file name="script.js">
// js here
</file>

Do not use placeholders. Do not skip files. Return only the code.`;

      const res = await api.post("/chat/send", { 
        message: fullMessage, 
        tool: "website" 
      });

      const reply = res.data.reply;
      
      const parsedFiles = {};
      const fileRegex = /<file\s+name=["']([^"']+)["']>\s*(.*?)\s*<\/file>/gis;
      let match;
      while ((match = fileRegex.exec(reply)) !== null) {
        let name = match[1].trim();
        let content = match[2].trim();
        content = content.replace(/^```[a-zA-Z]*\s*\n/, '').replace(/\n```\s*$/, '');
        parsedFiles[name] = content;
      }

      if (!parsedFiles["index.html"]) {
        toast.error("Generation failed to produce HTML. Please try again.");
      } else {
        if (!parsedFiles["styles.css"]) parsedFiles["styles.css"] = "* { margin: 0; padding: 0; box-sizing: border-box; }";
        if (!parsedFiles["script.js"]) parsedFiles["script.js"] = "console.log('App loaded.');";
        setFiles(parsedFiles);
        toast.success("Website generated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Generation failed. Make sure you have enough credits.");
    } finally {
      setLoading(false);
    }
  };

  const getPreviewHtml = () => {
    if (!files) return "";
    let html = files["index.html"];
    
    // Inject styles
    if (files["styles.css"]) {
      if (html.includes("</head>")) {
        html = html.replace("</head>", `<style>${files["styles.css"]}</style></head>`);
      } else {
        html += `<style>${files["styles.css"]}</style>`;
      }
    }
    
    // Inject script
    if (files["script.js"]) {
      if (html.includes("</body>")) {
        html = html.replace("</body>", `<script>${files["script.js"]}</script></body>`);
      } else {
        html += `<script>${files["script.js"]}</script>`;
      }
    }
    
    return html;
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-light">Fresh Website Builder</h1>
        <p className="text-slate-400">Describe what you want to build, and GREXO will instantly generate and preview the code.</p>
      </div>

      {!files ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="w-full max-w-3xl glass rounded-2xl p-6 border border-white/10 space-y-6 relative overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
                <p className="text-cyan-400 font-medium animate-pulse">Generating your website...</p>
              </div>
            )}
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={loading}
              placeholder="e.g., A dark-themed portfolio for a software engineer with a neon aesthetic and interactive hover effects..."
              className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 resize-none outline-none focus:border-cyan-500/50 transition-colors"
            />
            <div className="flex justify-end">
              <button 
                onClick={handleGenerate} 
                disabled={loading || !prompt.trim()} 
                className="bg-cyan-500 text-black hover:bg-cyan-400 px-8 py-4 rounded-xl font-medium text-lg flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Code2 className="w-5 h-5 mr-2" />
                Generate Website
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="h-14 border-b border-white/10 bg-black/20 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setFiles(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={18} />
              </button>
              <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === "preview" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <Play size={14} className="inline mr-1" /> Preview
                </button>
                <button
                  onClick={() => setActiveTab("code")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === "code" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <Code2 size={14} className="inline mr-1" /> Code
                </button>
              </div>
            </div>
            <button 
              onClick={() => {
                const blob = new Blob([getPreviewHtml()], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'website.html';
                a.click();
                URL.revokeObjectURL(url);
              }} 
              className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Download size={16} /> Export HTML
            </button>
          </div>
          
          <div className="flex-1 relative bg-white/5">
            {activeTab === "preview" ? (
              <iframe
                title="Preview"
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={getPreviewHtml()}
              />
            ) : (
              <div className="absolute inset-0 overflow-auto p-6 font-mono text-sm text-slate-300 whitespace-pre-wrap selection:bg-cyan-500/30">
                <div className="mb-4">
                  <h3 className="text-cyan-400 mb-2">index.html</h3>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5">{files["index.html"]}</div>
                </div>
                <div className="mb-4">
                  <h3 className="text-cyan-400 mb-2">styles.css</h3>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5">{files["styles.css"]}</div>
                </div>
                <div>
                  <h3 className="text-cyan-400 mb-2">script.js</h3>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5">{files["script.js"]}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
