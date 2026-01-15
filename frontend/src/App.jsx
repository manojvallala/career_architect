import { useState } from 'react';
import { analyzeResume } from './api';
import ReactMarkdown from 'react-markdown';

function App() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 

  const handleAnalyze = async () => {
    if (!file || !jobDesc) return alert("Please upload a file and job description");
    
    setLoading(true);
    setErrorMsg('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDesc);

    try {
      const response = await analyzeResume(formData);
      
      if (response.data.error) {
        setErrorMsg("⚠️ Backend Error: " + response.data.error);
      } else if (response.data.analysis) {
        setResult(response.data.analysis);
      } else {
        setErrorMsg("⚠️ Received unexpected data from server.");
      }

    } catch (error) {
      console.error(error);
      setErrorMsg("❌ Network Error: Is the backend running?");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-10 font-sans text-gray-800 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-indigo-600">🚀 Career Architect AI</h1>
        
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center hover:bg-gray-50 transition">
            <p className="mb-2 font-semibold">Upload Resume (PDF)</p>
            <input 
              type="file" 
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <div>
            <p className="mb-2 font-semibold">Job Description</p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Paste the job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:bg-gray-400 shadow-md"
        >
          {loading ? "Analyzing with AI..." : "Analyze My Gaps"}
        </button>

        {/* Error Message */}
        {errorMsg && (
          <div className="mt-8 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200 font-bold">
            {errorMsg}
          </div>
        )}

        {/* Results Section (Now formatted!) */}
        {result && (
          <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center border-b pb-2">
              🤖 AI Analysis Report
            </h2>
            
            {/* The Markdown Component with our custom class */}
            <div className="markdown-content text-gray-700 leading-relaxed">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;