import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { 
  UploadCloud, FileText, Search, Download, 
  MessageSquare, Sparkles, BarChart3, Zap, 
  ChevronRight, CheckCircle2, AlertCircle, X,
  Mic, MicOff, Volume2, Linkedin, Briefcase, ExternalLink, PenTool
} from 'lucide-react';

import { analyzeResume, improveSummary, chatWithRecruiter, generateCoverLetter, optimizeLinkedin, searchJobs } from './api';
import ReactMarkdown from 'react-markdown';
import Dashboard from './Dashboard';
import KeywordHeatmap from './KeywordHeatmap';
import html2pdf from 'html2pdf.js';

function App() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  
  // App State
  const [activeTab, setActiveTab] = useState('report'); 
  const [result, setResult] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // New Features State
  const [coverLetter, setCoverLetter] = useState('');
  const [linkedinContent, setLinkedinContent] = useState('');
  const [jobs, setJobs] = useState([]);
  const [genLoading, setGenLoading] = useState(false); // For cover letter/linkedin loading

  // Chat & Voice
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const reportRef = useRef(); 

  // --- API CALLS FOR NEW FEATURES ---
  const handleCoverLetter = async () => {
    setGenLoading(true);
    try {
      const res = await generateCoverLetter({ resume_text: resumeText, job_description: jobDesc });
      setCoverLetter(res.data.cover_letter);
      toast.success("Cover Letter Generated!");
    } catch (e) { toast.error("Failed to generate"); }
    setGenLoading(false);
  };

  const handleLinkedin = async () => {
    setGenLoading(true);
    try {
      const res = await optimizeLinkedin({ resume_text: resumeText, job_description: jobDesc });
      setLinkedinContent(res.data.linkedin_content);
      toast.success("LinkedIn Profile Optimized!");
    } catch (e) { toast.error("Failed to optimize"); }
    setGenLoading(false);
  };

  const handleJobSearch = async () => {
    try {
      // Search for the job title in the JD or generic
      const query = jobDesc.split(' ').slice(0, 4).join(' ') || "Software Engineer"; 
      const res = await searchJobs(query);
      setJobs(res.data.jobs);
    } catch (e) { console.error(e); }
  };

  // Trigger Job Search when analysis is done
  useEffect(() => {
    if (result) handleJobSearch();
  }, [result]);

  // --- EXISTING HANDLERS (Analyze, Chat, Voice, PDF) ---
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) { toast.error("Browser not supported"); return; }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US'; setIsListening(true); recognition.start();
    recognition.onresult = (e) => { setChatMsg(e.results[0][0].transcript); setIsListening(false); };
    recognition.onerror = () => setIsListening(false); recognition.onend = () => setIsListening(false);
  };

  const speakText = (text) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(u);
  };

  const handleAnalyze = async () => {
    if (!file || !jobDesc) { toast.error("Upload file & job desc"); return; }
    setLoading(true); setErrorMsg(''); setResult(null); setChatHistory([]);
    const formData = new FormData(); formData.append('file', file); formData.append('job_description', jobDesc);
    try {
      const res = await analyzeResume(formData);
      if (res.data.analysis) {
        setResult(res.data.analysis); setResumeText(res.data.resume_text || ""); 
        setActiveTab('report'); toast.success("Analysis Complete!");
      } else { setErrorMsg(res.data.error); }
    } catch (e) { setErrorMsg("Network Error"); }
    setLoading(false);
  };

  const handleChat = async () => {
    if (!chatMsg.trim()) return;
    const newHist = [...chatHistory, { role: 'user', content: chatMsg }];
    setChatHistory(newHist); setChatLoading(true); setChatMsg('');
    try {
      const res = await chatWithRecruiter({ message: chatMsg, chat_history: chatHistory });
      if (res.data.reply) {
        setChatHistory([...newHist, { role: 'assistant', content: res.data.reply }]);
        speakText(res.data.reply);
      }
    } catch (e) { toast.error("Chat Failed"); }
    setChatLoading(false);
  };

  const downloadPDF = () => {
    html2pdf().set({ margin: 10, filename: 'Career_Report.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4' } }).from(reportRef.current).save();
  };

  return (
    <div className="min-h-screen text-gray-800 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      <Toaster position="top-center" />
      
      {/* HEADER */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/20 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><Zap size={24} /></div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Career Architect AI</h1>
        </div>
        <span className="text-sm font-semibold text-gray-600 bg-indigo-100 px-3 py-1 rounded-full">v4.0 Final</span>
      </nav>

      <div className="max-w-7xl mx-auto pt-32 px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: CONTROLS */}
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><UploadCloud className="text-indigo-600" /> Resume & Job</h2>
            <div className="space-y-4">
              <div className="relative"><input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className={`border-2 border-dashed rounded-xl p-8 text-center ${file ? 'border-green-500 bg-green-50/50' : 'border-indigo-200'}`}>
                  {file ? <div className="text-green-700 flex flex-col items-center"><CheckCircle2 /><span className="text-sm">{file.name}</span></div> : <div className="text-indigo-400 flex flex-col items-center"><FileText /><span className="text-sm">Drop PDF Resume</span></div>}
                </div>
              </div>
              <textarea className="w-full p-4 bg-white/50 border border-gray-200 rounded-xl h-40 text-sm resize-none" placeholder="Paste Job Description..." value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} />
              <button onClick={handleAnalyze} disabled={loading} className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-all flex justify-center items-center gap-2">
                {loading ? "Analyzing..." : <><Sparkles size={20} /> Analyze Gaps</>}
              </button>
            </div>
          </div>
          {/* Chat Teaser */}
          {result && !showChat && (
            <div onClick={() => setShowChat(true)} className="glass-card p-4 rounded-xl cursor-pointer hover:bg-white/80 flex justify-between items-center group">
              <div className="flex items-center gap-3"><div className="bg-green-100 p-2 rounded-full text-green-600"><MessageSquare size={20}/></div><div><h3 className="font-bold">Ask AI Recruiter</h3></div></div><ChevronRight className="text-gray-400 group-hover:text-indigo-600" />
            </div>
          )}
        </motion.div>

        {/* RIGHT: RESULTS */}
        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="lg:col-span-8">
          <div className="glass-card min-h-[600px] rounded-3xl overflow-hidden border border-white/60 shadow-xl relative flex flex-col">
            {!result ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-white/50">
                <UploadCloud size={48} className="text-indigo-200 mb-4" />
                <h3 className="text-xl font-bold">Ready to Launch?</h3>
              </div>
            ) : (
              <>
                {/* TABS */}
                <div className="flex border-b border-gray-200 bg-gray-50/50 px-6 pt-4 gap-6 overflow-x-auto">
                  {[
                    {id: 'report', icon: FileText, label: 'Report'},
                    {id: 'heatmap', icon: Search, label: 'Keywords'},
                    {id: 'linkedin', icon: Linkedin, label: 'LinkedIn'},
                    {id: 'jobs', icon: Briefcase, label: 'Jobs'},
                  ].map((t) => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`pb-4 text-sm font-bold flex items-center gap-2 relative ${activeTab === t.id ? 'text-indigo-600' : 'text-gray-500'}`}>
                      <t.icon size={16}/> {t.label}
                      {activeTab === t.id && <motion.div layoutId="underline" className="absolute bottom-0 w-full h-0.5 bg-indigo-600" />}
                    </button>
                  ))}
                  <button onClick={downloadPDF} className="ml-auto text-xs font-bold text-gray-500 hover:text-indigo-600 flex gap-1"><Download size={14}/> PDF</button>
                </div>

                {/* CONTENT */}
                <div className="p-8 overflow-y-auto max-h-[700px] bg-white/40">
                  <AnimatePresence mode="wait">
                    
                    {/* 1. REPORT TAB */}
                    {activeTab === 'report' && (
                      <motion.div key="report" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <div ref={reportRef} className="markdown-content text-gray-700 leading-relaxed"><ReactMarkdown>{result}</ReactMarkdown></div>
                        {/* Cover Letter Generator */}
                        <div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                          <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2"><PenTool size={18}/> Need a Cover Letter?</h3>
                          {!coverLetter ? (
                            <button onClick={handleCoverLetter} disabled={genLoading} className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold border border-indigo-200 shadow-sm">
                              {genLoading ? "Writing..." : "Generate AI Cover Letter"}
                            </button>
                          ) : (
                            <div className="bg-white p-4 rounded-lg text-sm text-gray-700 border border-indigo-100 mt-3 whitespace-pre-wrap">{coverLetter}</div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* 2. LINKEDIN TAB */}
                    {activeTab === 'linkedin' && (
                      <motion.div key="linkedin" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
                        <div className="flex justify-between items-center">
                           <h3 className="font-bold text-xl">LinkedIn Optimization</h3>
                           <button onClick={handleLinkedin} disabled={genLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/30">
                             {genLoading ? "Optimizing..." : "Rewrite for LinkedIn"}
                           </button>
                        </div>
                        {linkedinContent ? (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm markdown-content">
                            <ReactMarkdown>{linkedinContent}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-center py-10 text-gray-400">Click the button to generate a viral profile.</div>
                        )}
                      </motion.div>
                    )}

                    {/* 3. JOBS TAB */}
                    {activeTab === 'jobs' && (
                      <motion.div key="jobs" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <h3 className="font-bold text-xl mb-4">Recommended Roles</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {jobs.map((job, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition flex justify-between items-center">
                              <div>
                                <h4 className="font-bold text-gray-800">{job.job_title}</h4>
                                <p className="text-sm text-gray-500">{job.employer_name} • {job.job_city}</p>
                              </div>
                              <a href={job.job_apply_link} target="_blank" rel="noreferrer" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                Apply <ExternalLink size={14}/>
                              </a>
                            </div>
                          ))}
                          {jobs.length === 0 && <p>Searching for jobs...</p>}
                        </div>
                      </motion.div>
                    )}

                    {/* 4. HEATMAP TAB */}
                    {activeTab === 'heatmap' && <KeywordHeatmap jobDescription={jobDesc} resumeText={resumeText} />}

                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* CHATBOT */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{y:100,opacity:0}} animate={{y:0,opacity:1}} exit={{y:100,opacity:0}} className="fixed bottom-6 right-6 w-96 h-[500px] glass-panel rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-indigo-200 z-50">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/> AI Recruiter</span>
              <div className="flex gap-2"><button onClick={()=>window.speechSynthesis.cancel()}><Volume2 size={18}/></button><button onClick={()=>setShowChat(false)}><X size={18}/></button></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {chatHistory.map((m,i)=><div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[85%] p-3 text-sm rounded-2xl ${m.role==='user'?'bg-indigo-600 text-white':'bg-white shadow-sm'}`}><ReactMarkdown>{m.content}</ReactMarkdown></div></div>)}
            </div>
            <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
              <button onClick={startListening} className={`p-2 rounded-full ${isListening?'bg-red-500 text-white animate-pulse':'bg-gray-100 text-gray-600'}`}>{isListening?<MicOff size={18}/>:<Mic size={18}/>}</button>
              <input value={chatMsg} onChange={(e)=>setChatMsg(e.target.value)} onKeyPress={(e)=>e.key==='Enter'&&handleChat()} placeholder="Type or speak..." className="flex-1 bg-gray-100 border-0 rounded-full px-4 text-sm focus:ring-2 focus:ring-indigo-500" />
              <button onClick={handleChat} className="bg-indigo-600 text-white p-2 rounded-full"><ChevronRight size={18}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;