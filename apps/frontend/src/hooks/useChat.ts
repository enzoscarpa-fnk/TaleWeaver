import { useEffect, useState } from 'react';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface GameContext {
    type: string;
    step?: string;
    data?: any;
}

const STORAGE_KEY = 'taleweaver_session_id';

function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [context, setContext] = useState<GameContext>({ type: 'idle' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [characterCreated, setCharacterCreated] = useState(0);
    const [gameInfoRefresh, setGameInfoRefresh] = useState(0);

    // 1) Initialiser / restaurer le sessionId
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setSessionId(stored);
        } else {
            const id = generateUUID();
            setSessionId(id);
            localStorage.setItem(STORAGE_KEY, id);
        }
    }, []);

    // 2) Charger l'historique quand on a un sessionId
    useEffect(() => {
        const loadHistory = async () => {
            if (!sessionId) return;

            try {
                const res = await fetch(`http://localhost:3001/api/conversations/${sessionId}`);

                if (!res.ok) {
                    console.error('Failed to load conversation history:', res.status, res.statusText);
                    return;
                }

                const data = await res.json() as {
                    id: string;
                    title: string | null;
                    messages: {
                        id: string;
                        role: 'user' | 'assistant' | 'system';
                        content: string;
                    }[];
                };

                setMessages(
                    data.messages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                );
            } catch (err) {
                console.error('Failed to load conversation history:', err);
            }
        };

        loadHistory();
    }, [sessionId]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || loading || !sessionId) return;

        setLoading(true);
        setError(null);

        const userMessage: Message = { role: 'user', content };
        setMessages((prev) => [...prev, userMessage]);

        console.log('📤 Sending:', { sessionId, message: content, context });

        try {
            const response = await fetch('http://localhost:3001/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId,
                    message: content,
                    context,
                }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'envoi du message');
            }

            const data = await response.json();
            console.log('📥 Received:', data);

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.aiMessage,
            };

            setMessages((prev) => [...prev, assistantMessage]);

            if (data.context) {
                setContext(data.context);
                console.log('🔄 Context updated:', data.context);

                // Détecte le type 'game' avec character présent
                if (data.context.type === 'game' && data.character) {
                    console.log('🎉 Character created, triggering refresh...');
                    setCharacterCreated(prev => prev + 1);
                }

                // Refresh GameInfo après chaque message en jeu
                if (data.context.type === 'game') {
                    console.log('🔄 Game message sent, refreshing game info...');
                    setGameInfoRefresh(prev => prev + 1);
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'envoi du message';
            setError(errorMessage);
            console.error('Chat error:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearMessages = () => {
        setMessages([]);
        setError(null);
        setContext({ type: 'idle' });
    };

    return {
        messages,
        context,
        loading,
        error,
        sendMessage,
        clearMessages,
        sessionId,
        characterCreated,
        gameInfoRefresh,
    };
};
