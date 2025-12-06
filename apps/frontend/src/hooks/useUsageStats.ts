import { useState, useEffect } from 'react';

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
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate.toISOString());
                if (endDate) params.append('endDate', endDate.toISOString());
                const queryParams = params.toString();

                const [totalRes, modelRes, dailyRes] = await Promise.all([
                    fetch(`http://localhost:3001/api/chat/stats/total?${queryParams}`),
                    fetch(`http://localhost:3001/api/chat/stats/by-model?${queryParams}`),
                    fetch(`http://localhost:3001/api/chat/stats/daily?${queryParams}`),
                ]);

                if (!totalRes.ok || !modelRes.ok || !dailyRes.ok) {
                    throw new Error('Failed to fetch stats');
                }

                const [total, model, daily] = await Promise.all([
                    totalRes.json(),
                    modelRes.json(),
                    dailyRes.json(),
                ]);

                setTotalStats(total);
                setModelStats(model);
                setDailyStats(daily);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error fetching stats');
                console.error('Stats error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [startDate?.getTime(), endDate?.getTime()]);

    return { totalStats, modelStats, dailyStats, loading, error };
};