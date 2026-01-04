import { useState, useEffect } from 'react';

interface GameInfoData {
    location: string;
    activeQuest: {
        name: string;
        description: string;
        objectives: Array<{
            id: string;
            description: string;
            completed: boolean;
        }>;
    } | null;
    recentEvents: Array<{
        type: string;
        content: string;
        timestamp: Date;
    }>;
}

export const useGameInfo = (sessionId: string | null, refreshTrigger: number) => {
    const [gameInfo, setGameInfo] = useState<GameInfoData>({
        location: 'Port de Tortuga',
        activeQuest: null,
        recentEvents: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGameInfo = async () => {
            if (!sessionId) return;

            try {
                setLoading(true);

                // Récupérer les infos de session
                const sessionRes = await fetch(`http://localhost:3001/api/game-state/${sessionId}`);
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();

                    // Récupérer les mémoires récentes
                    const memoriesRes = await fetch(`http://localhost:3001/api/memories/${sessionId}/recent?limit=5`);
                    let recentEvents = [];
                    if (memoriesRes.ok) {
                        recentEvents = await memoriesRes.json();
                    }

                    setGameInfo({
                        location: sessionData.currentLocation || 'Port de Tortuga',
                        activeQuest: sessionData.activeQuests?.[0] || null,
                        recentEvents: recentEvents.map((m: any) => ({
                            type: m.type,
                            content: m.content,
                            timestamp: new Date(m.timestamp),
                        })),
                    });
                }
            } catch (error) {
                console.error('Failed to fetch game info:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGameInfo();
    }, [sessionId, refreshTrigger]);

    return { gameInfo, loading };
};
