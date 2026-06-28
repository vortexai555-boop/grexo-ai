import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBYOK } from "@/hooks/useBYOK";
import { 
  Key, ShieldCheck, Cpu, CheckCircle2, ChevronRight, X, ArrowRight, 
  ExternalLink, Eye, EyeOff, Loader2, Sparkles, LayoutTemplate, 
  Image as ImageIcon, MessageSquareCode, FileText, Code2, PenTool
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function BYOKWizard() {
  const { wizardOpen, setWizardOpen, checkKeys } = useBYOK();
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState("google");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);

  if (!wizardOpen) return null;

  const handleClose = () => {
    setWizardOpen(false);
    setTimeout(() => {
      setStep(1);
      setApiKey("");
    }, 300);
  };

  const validateAndSave = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter your API Key");
      return;
    }
    
    setValidating(true);
    try {
      // 1. Test Connection
      await api.post("/settings/apikeys/test", {
        provider: selectedProvider,
        api_key: apiKey.trim()
      });
      
      // 2. If test passes, save it
      const res = await api.post("/settings/apikeys", {
        provider: selectedProvider,
        api_key: apiKey.trim()
      });
      
      if (res.data.status === "success") {
        await checkKeys();
        setStep(5);
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to connect API Key. Please try again.");
    } finally {
      setValidating(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="h-20 w-20 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.3)] border border-white/10">
              <Key className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Connect Your AI Provider</h2>
              <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
                To use AI Website Builder, AI Image Generator, AI Chat, Code Generator, Content Writer and other AI tools, you must connect your own AI API Key.
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 max-w-sm w-full backdrop-blur-sm">
              <div className="flex items-start space-x-3 text-left">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium mb-1">Your Key is Secure</h4>
                  <p className="text-sm text-slate-400">It is encrypted securely. Grexo AI never shares your key with anyone.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              className="mt-4 bg-white text-black px-8 py-3 rounded-full font-semibold text-lg hover:bg-slate-200 transition-all flex items-center space-x-2 group"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col w-full max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Choose AI Provider</h2>
              <p className="text-slate-400">Select the AI engine you want to power your experience.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => setSelectedProvider("google")}
                className={`p-6 rounded-2xl cursor-pointer border transition-all ${selectedProvider === 'google' ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                  </div>
                  {selectedProvider === 'google' && <CheckCircle2 className="w-6 h-6 text-cyan-500" />}
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">Google Gemini</h3>
                <p className="text-sm text-slate-400 mb-3">Google AI Studio</p>
                <div className="inline-flex px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  Available
                </div>
              </div>

              {[
                { name: "OpenAI", desc: "GPT-4 & DALL-E" },
                { name: "Anthropic", desc: "Claude 3.5 Sonnet" },
                { name: "Groq", desc: "Lightning Fast Inference" }
              ].map(p => (
                <div key={p.name} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] opacity-60 cursor-not-allowed">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Cpu className="w-6 h-6 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">{p.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">{p.desc}</p>
                  <div className="inline-flex px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs font-medium border border-white/10">
                    Coming Soon
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <button 
                onClick={() => setStep(3)}
                className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-slate-200 transition-all flex items-center space-x-2"
              >
                <span>Next Step</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col w-full max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Obtain Your API Key</h2>
              <p className="text-slate-400">Follow these steps to get your free Google Gemini API key.</p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start bg-white/5 border border-white/10 p-5 rounded-2xl">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="text-white font-medium text-lg mb-2">Open Google AI Studio</h4>
                  <p className="text-slate-400 text-sm mb-4">You will need to sign in with your Google Account.</p>
                  <a 
                    href="https://aistudio.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <span>Open Google AI Studio</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white/5 border border-white/10 p-5 rounded-2xl">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center font-bold">2</div>
                <div className="w-full">
                  <h4 className="text-white font-medium text-lg mb-1">Create API Key</h4>
                  <p className="text-slate-400 text-sm mb-3">Click on <strong>"Get API key"</strong> in the left sidebar, then click <strong>"Create API key"</strong>.</p>
                  <div className="bg-[#111116] border border-white/10 rounded-lg p-3 text-xs text-slate-500 italic">
                    Tip: You may need to create a new Google Cloud Project if you don't have one. Just follow the prompts.
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 items-start bg-white/5 border border-white/10 p-5 rounded-2xl">
                <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="text-white font-medium text-lg mb-1">Copy Your Key</h4>
                  <p className="text-slate-400 text-sm">Copy the generated key (it usually starts with <code className="bg-black/50 px-1.5 py-0.5 rounded text-cyan-300">AIza...</code>). Keep it secret.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-between items-center">
              <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white px-4 py-2 transition-colors">Back</button>
              <button 
                onClick={() => setStep(4)}
                className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-slate-200 transition-all flex items-center space-x-2"
              >
                <span>I have my API Key</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col w-full max-w-xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Paste API Key</h2>
              <p className="text-slate-400">Enter your Google Gemini API Key below to securely connect it to your account.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <label className="block text-sm font-medium text-slate-300 mb-2">Google Gemini API Key</label>
              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono text-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-3 flex justify-between items-center text-xs text-slate-500">
                <span>Never share your API Key.</span>
                <button 
                  onClick={() => setApiKey("")}
                  className="hover:text-white transition-colors"
                >
                  Clear Input
                </button>
              </div>
            </div>

            <div className="mt-10 flex justify-between items-center">
              <button onClick={() => setStep(3)} className="text-slate-400 hover:text-white px-4 py-2 transition-colors">Back</button>
              <button 
                onClick={validateAndSave}
                disabled={validating || !apiKey.trim()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center space-x-2 disabled:opacity-50 shadow-lg shadow-cyan-500/25"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Validating Connection...</span>
                  </>
                ) : (
                  <>
                    <span>Validate Connection</span>
                    <ShieldCheck className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center w-full max-w-2xl mx-auto"
          >
            <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </motion.div>
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">Setup Complete!</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
              Your AI Provider has been connected successfully. You've unlocked the full potential of Grexo AI.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mb-10 text-left">
              {[
                { icon: LayoutTemplate, label: "Website Builder" },
                { icon: ImageIcon, label: "Image Generator" },
                { icon: MessageSquareCode, label: "AI Chat" },
                { icon: Code2, label: "Code Generator" },
                { icon: PenTool, label: "Content Writer" },
                { icon: FileText, label: "Resume Builder" },
              ].map((feature, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.05) }}
                  key={feature.label} 
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center space-x-3"
                >
                  <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">{feature.label}</span>
                </motion.div>
              ))}
            </div>

            <button 
              onClick={handleClose}
              className="bg-white text-black px-10 py-3.5 rounded-full font-bold text-lg hover:bg-slate-200 transition-all flex items-center space-x-2"
            >
              <span>Start Creating</span>
              <Sparkles className="w-5 h-5" />
            </button>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 sm:p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none" />
        
        <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
          {/* Close button if they want to cancel */}
          {step < 5 && (
            <button 
              onClick={handleClose}
              className="absolute -top-12 right-0 sm:-right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          {/* Progress Indicator */}
          {step < 5 && (
            <div className="w-full max-w-xs mx-auto mb-10">
              <div className="flex justify-between items-center mb-2">
                {[1, 2, 3, 4].map(s => (
                  <div 
                    key={s} 
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      s === step ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 
                      s < step ? 'bg-cyan-500/40' : 'bg-white/10'
                    }`} 
                  />
                ))}
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: `${((step - 1) / 3) * 100}%` }}
                  animate={{ width: `${((step - 1) / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="w-full">
            <AnimatePresence mode="wait">
              <div key={step}>
                {renderStep()}
              </div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
