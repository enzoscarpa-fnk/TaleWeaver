import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface TotalStats {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
}

interface ModelStats {
    model: string;
    _sum: {
        totalCost: number;
        totalTokens: number;
    };
    _count: number;
}

interface DailyStats {
    id: string;
    date: string;
    model: string;
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
}

export const useUsageStats = (startDate?: Date, endDate?: Date) => {
    const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
    const [modelStats, setModelStats] = useState<ModelStats[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);

            try {
                const params: any = {};
                if (startDate) params.startDate = startDate.toISOString();
                if (endDate) params.endDate = endDate.toISOString();

                const [total, model, daily] = await Promise.all([
                    axios.get(`${API_URL}/api/chat/stats/total`, { params, withCredentials: true }),
                    axios.get(`${API_URL}/api/chat/stats/by-model`, { params, withCredentials: true }),
                    axios.get(`${API_URL}/api/chat/stats/daily`, { params, withCredentials: true }),
                ]);

                setTotalStats(total.data);
                setModelStats(model.data);
                setDailyStats(daily.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des statistiques');
                console.error('Stats error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [startDate?.getTime(), endDate?.getTime()]);

    return { totalStats, modelStats, dailyStats, loading, error };
};