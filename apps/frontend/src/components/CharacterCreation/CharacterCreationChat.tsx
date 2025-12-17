import React, { useState, useRef, useEffect } from 'react';
import { characterCreationService } from '../../services/character-creation.service';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const CharacterCreationChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [currentStep, setCurrentStep] = useState('name');
    const [characterData, setCharacterData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(() => `session-${Date.now()}`);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages([
            {
                role: 'assistant',
                content: '🏴‍☠️ Ahoy, matelot ! Bienvenue dans cette taverne où les légendes naissent ! Prends un rhum et prépare-toi à créer ton héros pirate. Quel nom veux-tu lui donner ? Quelques suggestions : Barbe-Noire, Anne la Tempête, Capitaine Drake.',
            },
        ]);
    }, []);

    // Auto-scroll vers le bas
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || loading || isSending) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setLoading(true);
        setIsSending(true);

        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

        try {
            console.log('📤 Sending:', { currentStep, userMessage, characterData });

            const response = await characterCreationService.processStep({
                sessionId,
                currentStep,
                userMessage,
                accumulatedData: characterData,
            });

            console.log('📥 Received:', response);

            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: response.aiMessage },
            ]);

            const updatedData = {
                ...characterData,
                ...response.extractedData,
            };

            setCharacterData(updatedData);
            console.log('💾 Updated character data:', updatedData);

            if (Object.keys(response.extractedData).length > 0) {
                const validationMsg = Object.entries(response.extractedData)
                    .map(([key, value]) => `✅ ${key}: ${value}`)
                    .join('\n');
                console.log('✅ Validated:\n', validationMsg);
            }

            if (response.nextStep !== 'complete') {
                setCurrentStep(response.nextStep);
                console.log('➡️ Next step:', response.nextStep);
            } else {
                await handleFinalize(updatedData);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: "Désolé, erreur. Peux-tu répéter ?",
                },
            ]);
        } finally {
            setLoading(false);
            setIsSending(false);
        }
    };

    const handleFinalize = async (finalData: any) => {
        try {
            console.log('🎉 Finalizing with ', finalData);

            const character = await characterCreationService.finalize(finalData);

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `✨ Félicitations ! Ton héros **${character.name}**, ${character.class} de niveau ${character.level}, est prêt pour l'aventure !\n\n🗡️ Force: ${character.strength}\n🧠 Intelligence: ${character.intelligence}\n🏃 Agilité: ${character.agility}\n\nRedirection vers le jeu...`,
                },
            ]);

            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        } catch (error) {
            console.error('❌ Finalization error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `❌ Erreur lors de la finalisation.\n\nDonnées recueillies : ${JSON.stringify(finalData, null, 2)}`,
                },
            ]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <h1 className="text-2xl font-bold">🎲 Création de Personnage</h1>
                <p className="text-sm text-gray-400">
                    Étape: {currentStep === 'name' && '📝 Nom'}
                    {currentStep === 'class' && '⚔️ Classe'}
                    {currentStep === 'backstory' && '📖 Histoire'}
                    {currentStep === 'stats' && '💪 Statistiques'}
                    {currentStep === 'complete' && '✅ Terminé'}
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                                msg.role === 'user'
                                    ? 'bg-blue-600'
                                    : 'bg-gray-800 border border-gray-700'
                            }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Écris ta réponse..."
                        disabled={loading}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={loading || isSending || !inputValue.trim()} // ✅ Ajout isSending
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
    );
};
