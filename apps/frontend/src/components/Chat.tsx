import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

type ChatHook = ReturnType<typeof import('../hooks/useChat').useChat>;

interface ChatProps {
    chatHook: ChatHook;
}

export const Chat: React.FC<ChatProps> = ({ chatHook }) => {
    const [input, setInput] = useState('');
    const { messages, loading, error, sendMessage } = chatHook;
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

    return (
        <div className="h-full flex flex-col bg-gray-900">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-12">
                        <p className="text-5xl mb-4">🎭</p>
                        <p className="text-xl mb-2 font-semibold">Bienvenue, aventurier !</p>
                        <div className="space-y-2 text-sm max-w-md mx-auto">
                            <p>Tape <code className="bg-gray-800 px-2 py-1 rounded font-mono">/create</code> pour créer ton personnage</p>
                            <p>Tape <code className="bg-gray-800 px-2 py-1 rounded font-mono">/help</code> pour voir toutes les commandes</p>
                        </div>
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
                            {/* Rendu Markdown pour les messages assistant */}
                            {msg.role === 'assistant' ? (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            // Paragraphes
                                            p: ({ children }) => (
                                                <p className="my-2 leading-relaxed text-sm text-gray-100">
                                                    {children}
                                                </p>
                                            ),
                                            // Gras
                                            strong: ({ children }) => (
                                                <strong className="font-bold text-white">
                                                    {children}
                                                </strong>
                                            ),
                                            // Italique
                                            em: ({ children }) => (
                                                <em className="italic text-gray-300">
                                                    {children}
                                                </em>
                                            ),
                                            // Code inline
                                            code: ({ children }) => (
                                                <code className="bg-gray-900 px-1.5 py-0.5 rounded text-blue-400 text-xs font-mono">
                                                    {children}
                                                </code>
                                            ),
                                            // Listes non ordonnées
                                            ul: ({ children }) => (
                                                <ul className="my-2 list-disc pl-4 space-y-1">
                                                    {children}
                                                </ul>
                                            ),
                                            // Listes ordonnées
                                            ol: ({ children }) => (
                                                <ol className="my-2 list-decimal pl-4 space-y-1">
                                                    {children}
                                                </ol>
                                            ),
                                            // Items de liste
                                            li: ({ children }) => (
                                                <li className="text-sm text-gray-100">
                                                    {children}
                                                </li>
                                            ),
                                            // Titres
                                            h1: ({ children }) => (
                                                <h1 className="text-xl font-bold text-white mt-3 mb-2">
                                                    {children}
                                                </h1>
                                            ),
                                            h2: ({ children }) => (
                                                <h2 className="text-lg font-bold text-white mt-3 mb-2">
                                                    {children}
                                                </h2>
                                            ),
                                            h3: ({ children }) => (
                                                <h3 className="text-base font-bold text-white mt-2 mb-1">
                                                    {children}
                                                </h3>
                                            ),
                                            // Séparateur horizontal
                                            hr: () => (
                                                <hr className="my-4 border-gray-600" />
                                            ),
                                            // Bloc de code
                                            pre: ({ children }) => (
                                                <pre className="bg-gray-900 p-3 rounded my-2 overflow-x-auto">
                                                    {children}
                                                </pre>
                                            ),
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg text-sm">
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
                        placeholder="Écris ton message ou tape une commande (/create, /help)..."
                        disabled={loading}
                        className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>...</span>
                            </>
                        ) : (
                            <>
                                <span>Envoyer</span>
                                <span>→</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
