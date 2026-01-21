import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const analyzeResume = async (formData) => {
    return await axios.post(`${API_URL}/analyze_resume/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const getHistory = async () => { return await axios.get(`${API_URL}/history/`); };
export const improveSummary = async (data) => { return await axios.post(`${API_URL}/improve_summary/`, data); };
export const chatWithRecruiter = async (data) => { return await axios.post(`${API_URL}/chat/`, data); };

// --- NEW FEATURES ---
export const generateCoverLetter = async (data) => {
    return await axios.post(`${API_URL}/generate_cover_letter/`, data);
};

export const optimizeLinkedin = async (data) => {
    return await axios.post(`${API_URL}/optimize_linkedin/`, data);
};

export const searchJobs = async (query) => {
    return await axios.get(`${API_URL}/search_jobs/`, { params: { query } });
};