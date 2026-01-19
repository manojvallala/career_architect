import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/history/');
      // Format data for the chart
      const formattedData = response.data.map((item, index) => ({
        name: `Scan ${index + 1}`,
        role: item.job_role.substring(0, 15) + "...", // Shorten the name
        score: item.match_score,
        fullDate: new Date(item.created_at).toLocaleDateString()
      }));
      setHistory(formattedData);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  return (
    <div className="mt-12 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📈 Progress Tracker</h2>

      {history.length > 0 ? (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="role" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f3f4f6', borderRadius: '8px' }}
                labelStyle={{ fontWeight: 'bold', color: '#4f46e5' }}
              />
              <Legend />
              <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Match Score (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-10">
          No history yet. Analyze your first resume to see the chart!
        </p>
      )}
    </div>
  );
};

export default Dashboard;