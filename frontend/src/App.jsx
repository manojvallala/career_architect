import { useState } from 'react';
import { analyzeResume, improveSummary } from './api';
import ReactMarkdown from 'react-markdown';
import Dashboard from './Dashboard';

function App() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState(null);
  const [resumeText, setResumeText] = useState(''); // Stores text for rewriter
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Rewriter State
  const [improvedSummary, setImprovedSummary] = useState('');
  const [rewriting, setRewriting] = useState(false);
  
  // Dashboard Refresh Key
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAnalyze = async () => {
    if (!file || !jobDesc) return alert("Please upload a file and job description");
    
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    setImprovedSummary('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDesc);

    try {
      const response = await analyzeResume(formData);
      
      if (response.data.error) {
        setErrorMsg("⚠️ Backend Error: " + response.data.error);
      } else if (response.data.analysis) {
        setResult(response.data.analysis);
        // Save the extracted text so we can use it for the Rewrite feature
        setResumeText(response.data.resume_text || ""); 
        // Trigger Dashboard Refresh
        setRefreshKey(prev => prev + 1);
      } else {
        setErrorMsg("⚠️ Received unexpected data.");
      }

    } catch (error) {
      console.error(error);
      setErrorMsg("❌ Network Error: Is the backend running?");
    }
    setLoading(false);
  };

  const handleRewrite = async () => {
    if (!resumeText) return alert("Please analyze a resume first!");
    setRewriting(true);
    try {
      const response = await improveSummary({
        resume_text: resumeText,
        job_description: jobDesc
      });
      if (response.data.improved_summary) {
        setImprovedSummary(response.data.improved_summary);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to rewrite summary");
    }
    setRewriting(false);
  };

  return (
    <div className="min-h-screen p-10 font-sans text-gray-800 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-indigo-600 flex items-center gap-2">
          🚀 Career Architect AI
        </h1>
        
        {/* --- INPUT SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-indigo-200 p-6 rounded-xl text-center hover:bg-indigo-50 transition bg-indigo-50/30">
            <p className="mb-2 font-bold text-indigo-900">1. Upload Resume (PDF)</p>
            <input 
              type="file" 
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
            />
            {file && <p className="mt-2 text-sm text-green-600 font-bold">✅ {file.name}</p>}
          </div>
          <div>
            <p className="mb-2 font-bold text-indigo-900">2. Paste Job Description</p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
              placeholder="Paste the job requirements here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </div>
        </div>

        {/* --- ANALYZE BUTTON --- */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`mt-6 w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all 
            ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg transform hover:-translate-y-1"}`}
        >
          {loading ? "⚙️ AI is Analyzing... (Please Wait)" : "✨ Analyze My Gaps"}
        </button>

        {errorMsg && (
          <div className="mt-8 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200 font-bold">
            {errorMsg}
          </div>
        )}

        {/* --- RESULTS SECTION --- */}
        {result && (
          <div className="mt-8 p-8 bg-white rounded-xl shadow-md border border-indigo-100 ring-1 ring-indigo-50">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700 border-b pb-4">
              🤖 AI Analysis Report
            </h2>
            <div className="markdown-content text-gray-700 leading-relaxed">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>

            {/* --- AI REWRITER SECTION --- */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">✨ AI Career Coach</h3>
                <button 
                  onClick={handleRewrite}
                  disabled={rewriting}
                  className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 transition shadow-sm flex items-center gap-2"
                >
                  {rewriting ? "✍️ Writing..." : "🪄 Rewrite My Summary"}
                </button>
              </div>
              
              {improvedSummary && (
                <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 shadow-inner">
                  <p className="italic font-medium mb-3">"{improvedSummary}"</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(improvedSummary)}
                    className="text-xs font-bold text-purple-700 uppercase tracking-wide hover:underline"
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- DASHBOARD SECTION --- */}
        <Dashboard key={refreshKey} />

      </div>
    </div>
  );
}

export default App;