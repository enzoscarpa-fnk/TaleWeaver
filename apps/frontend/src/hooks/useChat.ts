import { useEffect, useState } from 'react';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface GameContext {
    type: string;
    step?: string;
    data?: any;
    characterId?: string;
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
    const [isInitializing, setIsInitializing] = useState(true);

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
                setIsInitializing(true);

                let restoredContext = { type: 'idle' };
                const contextRes = await fetch(`http://localhost:3001/api/conversations/${sessionId}/context`);
                if (contextRes.ok) {
                    restoredContext = await contextRes.json();
                    console.log('🔄 Context restored:', restoredContext);
                    setContext(restoredContext);
                }

                // Charger l'historique des messages
                const res = await fetch(`http://localhost:3001/api/conversations/${sessionId}`);

                if (res.ok) {
                    const data = await res.json();

                    // Si data est null, c'est une nouvelle conversation
                    if (data && data.messages) {
                        setMessages(
                            data.messages.map((m: any) => ({
                                role: m.role,
                                content: m.content,
                            })),
                        );
                        console.log(`✅ Loaded ${data.messages.length} messages with context: ${restoredContext.type}`);
                    } else {
                        console.log('✅ New conversation (no messages yet), context:', restoredContext.type);
                    }
                } else {
                    console.log('✅ New conversation (404), context:', restoredContext.type);
                }
            } catch (err) {
                console.error('Failed to load conversation history:', err);
            } finally {
                setIsInitializing(false);
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

                if (data.context.type === 'game' && data.character) {
                    console.log('🎉 Character created, triggering refresh...');
                    setCharacterCreated(prev => prev + 1);
                }

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
        isInitializing,
    };
};
