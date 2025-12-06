import { useState } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ApiError {
    message: string;
    status?: number;
}

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                }),
            });

            if (!response.ok) {
                const errorData: ApiError = await response.json().catch(() => ({
                    message: 'Erreur réseau',
                }));
                throw new Error(errorData.message || 'Erreur lors de l\'envoi du message');
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

    return { messages, loading, error, sendMessage, clearMessages };
};
