import React, { useState, useRef, useEffect } from 'react';

type ChatHook = ReturnType<typeof import('../hooks/useChat').useChat>;

interface ChatProps {
    chatHook: ChatHook;
}

export const Chat: React.FC<ChatProps> = ({ chatHook }) => {
    const [input, setInput] = useState('');
    const { messages, context, loading, error, sendMessage } = chatHook;
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        sendMessage(input);
        setInput('');
    };

    // Badge de contexte
    const getContextBadge = () => {
        switch (context.type) {
            case 'character-creation':
                return (
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        📝 Création - {context.step}
                    </span>
                );
            case 'exploration':
                return (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        🗺️ Exploration
                    </span>
                );
            case 'combat':
                return (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        ⚔️ Combat
                    </span>
                );
            default:
                return (
                    <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        💬 Prêt à l'aventure
                    </span>
                );
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-900">
            {/* Header avec badge */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">🏴‍☠️ TaleWeaver</h1>
                {getContextBadge()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        <p className="text-4xl mb-2">🎭</p>
                        <p className="text-lg mb-1">Bienvenue, aventurier !</p>
                        <p className="text-sm">Tape <code className="bg-gray-800 px-2 py-1 rounded">/help</code> pour voir les commandes</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                msg.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                            }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-2 rounded-lg text-sm">
                        ⚠️ {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4 bg-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Tape /create pour créer un personnage, /help pour l'aide..."
                        disabled={loading}
                        className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                        {loading ? '...' : 'Envoyer'}
                    </button>
                </div>
            </form>
        </div>
    );
};
