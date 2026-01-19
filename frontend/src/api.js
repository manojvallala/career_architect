import axios from 'axios';

const API_URL = "http://127.0.0.1:8000";

// 1. Analyze Resume
export const analyzeResume = async (formData) => {
    return await axios.post(`${API_URL}/analyze_resume/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// 2. Get History for Dashboard
export const getHistory = async () => {
    return await axios.get(`${API_URL}/history/`);
};

// 3. AI Rewriter
export const improveSummary = async (data) => {
    return await axios.post(`${API_URL}/improve_summary/`, data, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
};