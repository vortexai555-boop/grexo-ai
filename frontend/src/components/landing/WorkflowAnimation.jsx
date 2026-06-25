import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Code, ImageIcon, Globe, FileText } from "lucide-react";

export default function WorkflowAnimation() {
  return (
    <div className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#020617] to-[#020617] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-6 relative z-10 text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
          One prompt. <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Infinite outputs.</span>
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Grexo AI automatically routes your intent to the right specialized engine.
        </p>
      </div>

      <div className="max-w-4xl mx-auto relative h-[400px] flex items-center justify-center">
        {/* Center Node */}
        <motion.div 
          animate={{ boxShadow: ["0 0 0 0 rgba(0,229,255,0.4)", "0 0 0 30px rgba(0,229,255,0)"] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute z-20 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(0,229,255,0.5)]"
        >
          <Sparkles size={36} className="text-white" />
        </motion.div>

        {/* Input Prompt */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="absolute left-0 md:left-[10%] top-1/2 -translate-y-1/2 bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-xl text-sm text-slate-300 w-48"
        >
          "Generate a landing page for my new app, include hero images and copy."
        </motion.div>

        {/* Animated Lines connecting center to edges */}
        
        {/* Output Nodes */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute right-0 md:right-[15%] top-[10%] bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-3 w-48"
        >
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Globe size={18} /></div>
          <div className="text-sm font-medium text-white">Website Built</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute right-[-20px] md:right-[5%] top-[50%] -translate-y-1/2 bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-3 w-48"
        >
          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><ImageIcon size={18} /></div>
          <div className="text-sm font-medium text-white">Images Gen</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="absolute right-0 md:right-[15%] bottom-[10%] bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-3 w-48"
        >
          <div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><FileText size={18} /></div>
          <div className="text-sm font-medium text-white">Copy Written</div>
        </motion.div>

        {/* Arrow SVGs */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10">
          <path d="M 250 200 L 450 200" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M 450 200 L 650 100" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M 450 200 L 700 200" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M 450 200 L 650 300" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
          
          <circle cx="450" cy="200" r="4" fill="#00E5FF">
            <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>

      </div>
    </div>
  );
}
