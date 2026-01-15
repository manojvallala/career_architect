import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const analyzeResume = async (formData) => {
    return axios.post(`${API_URL}/analyze_resume/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const getApplications = async () => {
    return axios.get(`${API_URL}/applications/`);
};