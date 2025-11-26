import { useState } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback pour les anciens navigateurs
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId] = useState(() => generateUUID());

    const sendMessage = async (content: string) => {
        setLoading(true);
        setError(null);

        const newUserMessage: Message = { role: 'user', content };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);

        try {
            const response = await fetch('http://localhost:3001/api/chat/completion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: updatedMessages,
                    sessionId,
                }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'envoi du message');
            }

            const data = await response.json();

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.choices[0].message.content,
            };

            setMessages([...updatedMessages, assistantMessage]);
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Erreur lors de l\'envoi du message';
            setError(errorMessage);
            console.error('Chat error:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearMessages = () => {
        setMessages([]);
        setError(null);
    };

    return { messages, loading, error, sendMessage, clearMessages, sessionId };
};
