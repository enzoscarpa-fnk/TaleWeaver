import { Injectable } from '@nestjs/common';
import { CharacterCreationService } from '../characters/character-creation.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenRouterService, Message as OpenRouterMessage } from '../openrouter/openrouter.service';
import { AI_MODELS, AI_TEMPERATURES } from '../config/ai-models.config';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { GameStateService } from '../game-state/game-state.service';

@Injectable()
export class ChatService {
    constructor(
        private characterCreationService: CharacterCreationService,
        private prisma: PrismaService,
        private openRouter: OpenRouterService,
        private embeddingsService: EmbeddingsService,
        private gameStateService: GameStateService,
    ) {}

    async processMessage(sessionId: string, message: string, context: any) {
        console.log('💬 Processing message in context:', context?.type);

        // Détecte les commandes de changement de contexte
        if (message.startsWith('/')) {
            return this.handleCommand(sessionId, message, context);
        }

        // Route selon le contexte actif
        switch (context?.type) {
            case 'welcome':
                return this.handleWelcome(sessionId, message, context);

            case 'character-creation':
                return this.handleCharacterCreation(sessionId, message, context);

            case 'game':
                return this.handleGame(sessionId, message, context);

            case 'exploration':
                return this.handleExploration(sessionId, message, context);

            case 'combat':
                return this.handleCombat(sessionId, message, context);

            case 'idle':
            default:
                return this.handleIdleChat(sessionId, message);
        }
    }

    private async handleCommand(sessionId: string, command: string, currentContext: any) {
        const cmd = command.toLowerCase();

        // Commande pour démarrer la création de personnage
        if (cmd === '/create' || cmd === '/créer') {
            return {
                aiMessage: '🏴‍☠️ **Bienvenue dans la création de personnage, moussaillon !**\n\n' +
                    'Tu as franchi la ligne des eaux troubles pour rejoindre les rangs des frères et sœurs des sept mers – et nous, on est ravis de t\'accueillir parmi nous.\n\n' +
                    'Ici, pas de règles stupides, mais des lois du vent, de l\'honneur et de la liberté. Tu vas apprendre à :\n' +
                    '- Naviguer (même si ton premier bateau est une coquille de noix… on a tous commencé comme ça)\n' +
                    '- Défier les tempêtes (métaphoriques… ou pas)\n' +
                    '- Partager le butin (surtout les rhums et les histoires de batailles épiques)\n' +
                    '- Devenir une légende (ou au moins une bonne anecdote à raconter au tavernier)\n\n' +
                    '**Alors, matelot, quel est ton nom ?**',
                context: {
                    type: 'character-creation',
                    step: 'name',
                    data: {},
                },
                extractedData: {},
            };
        }

        // Commande pour quitter le contexte actuel
        if (cmd === '/quit' || cmd === '/quitter') {
            return {
                aiMessage: 'Tu quittes le contexte actuel. Que veux-tu faire maintenant ?',
                context: { type: 'welcome' },
                extractedData: {},
            };
        }

        // Commande d'aide
        if (cmd === '/help' || cmd === '/aide') {
            return {
                aiMessage: '⚓ **Commandes disponibles :**\n\n' +
                    '- `/create` ou `/créer` : Créer un personnage\n' +
                    '- `/quit` ou `/quitter` : Quitter le contexte actuel\n' +
                    '- `/help` ou `/aide` : Afficher cette aide\n' +
                    '- `/stats` : Voir tes statistiques\n' +
                    '- `/inventory` ou `/inv` : Voir ton inventaire\n' +
                    '- `/quests` : Voir tes quêtes actives\n\n' +
                    '**🎮 Comment jouer :**\n' +
                    'Si tu n\'as pas encore de personnage, commence par `/create`.\n' +
                    'Sinon, parle normalement pour interagir avec le monde !',
                context: currentContext,
                extractedData: {},
            };
        }

        // Commande pour voir les stats (en jeu uniquement)
        if ((cmd === '/stats' || cmd === '/statistiques') && currentContext?.type === 'game') {
            try {
                const gameContext = await this.gameStateService.getGameContext(sessionId);
                const { character, session } = gameContext;

                return {
                    aiMessage: `**📊 Statistiques de ${character.name}**\n\n` +
                        `**Niveau :** ${character.level} | **XP :** ${character.experience}\n` +
                        `**PV :** ${character.health}/${character.maxHealth}\n` +
                        `**Mana :** ${character.mana}/${character.maxMana}\n\n` +
                        `**Attributs :**\n` +
                        `⚔️ Force : ${character.strength}\n` +
                        `🧠 Intelligence : ${character.intelligence}\n` +
                        `⚡ Agilité : ${character.agility}\n\n` +
                        `**Richesse :**\n` +
                        `💰 Or : ${session.gold} pièces\n` +
                        `⭐ Réputation : ${session.reputation}\n\n` +
                        `**Localisation :** ${session.currentLocation}`,
                    context: currentContext,
                    extractedData: {},
                };
            } catch (error) {
                console.error('❌ Stats command error:', error);
                return {
                    aiMessage: '❌ Impossible de récupérer tes stats pour le moment.',
                    context: currentContext,
                    extractedData: {},
                };
            }
        }

        // Commande pour voir l'inventaire
        if ((cmd === '/inventory' || cmd === '/inv') && currentContext?.type === 'game') {
            try {
                const gameContext = await this.gameStateService.getGameContext(sessionId);
                const { inventory } = gameContext;

                if (inventory.length === 0) {
                    return {
                        aiMessage: '🎒 **Ton inventaire est vide.**\n\nPars à l\'aventure pour trouver des objets !',
                        context: currentContext,
                        extractedData: {},
                    };
                }

                const equipped = inventory.filter(i => i.equippedAt);
                const stored = inventory.filter(i => !i.equippedAt);

                let inventoryText = '🎒 **Ton inventaire**\n\n';

                if (equipped.length > 0) {
                    inventoryText += '**🗡️ Équipé :**\n';
                    equipped.forEach(item => {
                        inventoryText += `- ${item.name} (${item.type})\n`;
                    });
                    inventoryText += '\n';
                }

                if (stored.length > 0) {
                    inventoryText += '**📦 Sac :**\n';
                    stored.forEach(item => {
                        inventoryText += `- ${item.name} x${item.quantity}\n`;
                    });
                }

                return {
                    aiMessage: inventoryText,
                    context: currentContext,
                    extractedData: {},
                };
            } catch (error) {
                console.error('❌ Inventory command error:', error);
                return {
                    aiMessage: '❌ Impossible d\'accéder à ton inventaire.',
                    context: currentContext,
                    extractedData: {},
                };
            }
        }

        // Commande pour voir les quêtes
        if (cmd === '/quests' && currentContext?.type === 'game') {
            try {
                const gameContext = await this.gameStateService.getGameContext(sessionId);
                const { activeQuests } = gameContext;

                if (activeQuests.length === 0) {
                    return {
                        aiMessage: '📜 **Aucune quête active.**\n\nExplore le monde pour trouver des aventures !',
                        context: currentContext,
                        extractedData: {},
                    };
                }

                let questsText = '📜 **Tes quêtes actives**\n\n';
                activeQuests.forEach(quest => {
                    const objectives = JSON.parse(quest.objectives);
                    const completed = objectives.filter(o => o.completed).length;

                    questsText += `**${quest.name}** (${completed}/${objectives.length})\n`;
                    questsText += `_${quest.description}_\n\n`;

                    objectives.forEach(obj => {
                        questsText += `${obj.completed ? '✅' : '⏳'} ${obj.description}\n`;
                    });

                    questsText += `💰 Récompense : ${quest.goldReward} or | ⭐ ${quest.xpReward} XP\n\n`;
                });

                return {
                    aiMessage: questsText,
                    context: currentContext,
                    extractedData: {},
                };
            } catch (error) {
                console.error('❌ Quests command error:', error);
                return {
                    aiMessage: '❌ Impossible de récupérer tes quêtes.',
                    context: currentContext,
                    extractedData: {},
                };
            }
        }

        return {
            aiMessage: 'Commande inconnue. Tape `/help` pour voir les commandes disponibles.',
            context: currentContext,
            extractedData: {},
        };
    }

    private async handleWelcome(sessionId: string, message: string, context: any) {
        // Vérifie si le joueur a déjà un personnage
        const characters = await this.prisma.character.findMany({
            orderBy: { createdAt: 'desc' },
        });
        const hasCharacter = characters.length > 0;

        if (hasCharacter) {
            const character = characters[0];

            // Créer ou récupérer la session de jeu
            let gameSession = await this.prisma.gameSession.findUnique({
                where: { conversationId: sessionId },
            });

            if (!gameSession) {
                console.log('🎮 Creating new game session...');
                gameSession = await this.gameStateService.createGameSession(
                    sessionId,
                    character.id,
                );

                // Stocker l'événement de début d'aventure
                await this.embeddingsService.storeMemory({
                    sessionId,
                    type: 'NARRATIVE',
                    content: `${character.name} commence une nouvelle aventure au Port de Tortuga`,
                    metadata: { characterId: character.id },
                });
            }

            return {
                aiMessage: `**Bienvenue à bord, ${character.name} !** 🏴‍☠️\n\n` +
                    'Ta légende commence ici, dans les eaux tumultueuses des Caraïbes. Ton navire tangue doucement au port de Tortuga, l\'équipage attend tes ordres.\n\n' +
                    '💡 _Tape `/help` pour voir les commandes disponibles._\n\n' +
                    'Que veux-tu faire ?',
                context: {
                    type: 'game',
                    characterId: character.id,
                },
                extractedData: {},
            };
        } else {
            return {
                aiMessage: '⚓ **Bienvenue dans TaleWeaver !**\n\n' +
                    'Dans ce jeu de rôle pirate, tu incarnes un flibustier intrépide naviguant sur les sept mers.\n' +
                    'Explore des îles mystérieuses, affronte des dangers et forge ta légende !\n\n' +
                    '**📜 Les bases :**\n' +
                    '- Crée ton personnage avec ses compétences uniques\n' +
                    '- Explore le monde en parlant naturellement au maître du jeu\n' +
                    '- Tes choix déterminent ton destin\n\n' +
                    'Pour commencer ton aventure, tape `/create` pour créer ton personnage ! 🏴‍☠️',
                context: { type: 'welcome' },
                extractedData: {},
            };
        }
    }

    private async handleCharacterCreation(sessionId: string, message: string, context: any) {
        const currentData = context.mergedData || context.data || {};

        console.log('📦 Processing character creation with ', currentData);

        const result = await this.characterCreationService.processCreationStep(
            sessionId,
            message,
            {
                step: context.step as any,
                prompt: '',
                data: currentData,
            },
        );

        const mergedData = { ...currentData, ...result.extractedData };
        console.log('📦 Merged ', mergedData);

        if (result.nextStep === 'complete') {
            console.log('🎉 Character creation complete, finalizing...');
            console.log('📦 Final character ', mergedData);

            try {
                // Créer la conversation
                let conversation = await this.prisma.conversation.findUnique({
                    where: { id: sessionId },
                });

                if (!conversation) {
                    console.log('📝 Creating conversation record...');
                    conversation = await this.prisma.conversation.create({
                        data: {
                            id: sessionId,
                            title: 'Nouvelle aventure',
                        },
                    });
                    console.log(`✅ Conversation created: ${conversation.id}`);
                } else {
                    console.log(`✅ Conversation already exists: ${conversation.id}`);
                }

                // Créer le personnage
                const character = await this.characterCreationService.finalizeCharacter(mergedData);
                console.log(`✅ Character created: ${character.id}`);

                // Mettre à jour le titre de la conversation
                await this.prisma.conversation.update({
                    where: { id: sessionId },
                    data: { title: `Aventure de ${character.name}` },
                });

                // Créer la session de jeu
                let gameSession = await this.prisma.gameSession.findUnique({
                    where: { conversationId: sessionId },
                });

                if (!gameSession) {
                    console.log('🎮 Creating game session...');
                    gameSession = await this.gameStateService.createGameSession(
                        sessionId,
                        character.id,
                    );
                    console.log(`✅ Game session created: ${gameSession.id}`);
                } else {
                    console.log('⚠️ GameSession already exists, updating character...');
                    gameSession = await this.prisma.gameSession.update({
                        where: { conversationId: sessionId },
                        data: { characterId: character.id },
                    });
                }

                // Stocker la création du personnage en mémoire
                await this.embeddingsService.storeMemory({
                    sessionId,
                    type: 'NARRATIVE',
                    content: `Création du personnage ${character.name}, un ${character.class}. ${character.backstory}`,
                    metadata: { characterId: character.id },
                });
                console.log('✅ Memory stored');

                return {
                    aiMessage: '🎉 **Félicitations !** Ton personnage est prêt pour l\'aventure !\n\n' +
                        `**${character.name}** - ${character.class}\n\n` +
                        `⚔️ Force : ${character.strength}\n` +
                        `🧠 Intelligence : ${character.intelligence}\n` +
                        `⚡ Agilité : ${character.agility}\n\n` +
                        `_${character.backstory}_\n\n` +
                        '---\n\n' +
                        '**Que les mers te soient favorables ! 🏴‍☠️**\n\n' +
                        `Ton navire est amarré à ${gameSession.currentLocation}. L\'équipage attend tes ordres, capitaine.\n\n` +
                        '💡 _Tape `/help` pour voir les commandes disponibles._\n\n' +
                        'Que veux-tu faire ?',
                    context: {
                        type: 'game',
                        characterId: character.id,
                    },
                    extractedData: result.extractedData,
                    character,
                };
            } catch (error) {
                console.error('❌ Finalization error:', error);
                return {
                    aiMessage: '❌ Une erreur est survenue lors de la sauvegarde de ton personnage. Réessaie avec `/create`.',
                    context: { type: 'welcome' },
                    extractedData: {},
                };
            }
        }

        return {
            ...result,
            context: {
                type: 'character-creation',
                step: result.nextStep,
                mergedData,
            },
        };
    }

    private async handleGame(sessionId: string, message: string, context: any) {
        try {
            // Détecter les questions factuelles
            const factualQuestions = [
                { pattern: /où (suis|est|me trouve)/i, type: 'location' },
                { pattern: /combien.*(?:or|pièces|argent)/i, type: 'gold' },
                { pattern: /(?:mes|tes) stats?/i, type: 'stats' },
                { pattern: /(?:mon|ton) inventaire/i, type: 'inventory' },
            ];

            const matchedQuestion = factualQuestions.find(q => q.pattern.test(message));

            if (matchedQuestion) {
                const gameContext = await this.gameStateService.getGameContext(sessionId, message);

                switch (matchedQuestion.type) {
                    case 'location':
                        return {
                            aiMessage: `📍 **Tu es actuellement à : ${gameContext.session.currentLocation}**\n\n` +
                                `Que veux-tu faire ?`,
                            context: { type: 'game', characterId: gameContext.character.id },
                            extractedData: {},
                        };
                    case 'gold':
                        return {
                            aiMessage: `💰 **Tu as ${gameContext.session.gold} pièces d'or.**`,
                            context: { type: 'game', characterId: gameContext.character.id },
                            extractedData: {},
                        };
                    case 'stats':
                        return {
                            aiMessage: `**📊 Statistiques de ${gameContext.character.name}**\n\n` +
                                `**Niveau :** ${gameContext.character.level} | **XP :** ${gameContext.character.experience}\n` +
                                `**PV :** ${gameContext.character.health}/${gameContext.character.maxHealth}\n` +
                                `**Mana :** ${gameContext.character.mana}/${gameContext.character.maxMana}\n\n` +
                                `**Attributs :**\n` +
                                `⚔️ Force : ${gameContext.character.strength}\n` +
                                `🧠 Intelligence : ${gameContext.character.intelligence}\n` +
                                `⚡ Agilité : ${gameContext.character.agility}\n\n` +
                                `**Richesse :**\n` +
                                `💰 Or : ${gameContext.session.gold} pièces\n` +
                                `⭐ Réputation : ${gameContext.session.reputation}\n\n` +
                                `**Localisation :** ${gameContext.session.currentLocation}`,
                            context: { type: 'game', characterId: gameContext.character.id },
                            extractedData: {},
                        };

                    case 'inventory':
                        if (gameContext.inventory.length === 0) {
                            return {
                                aiMessage: '🎒 **Ton inventaire est vide.**\n\nPars à l\'aventure pour trouver des objets !',
                                context: { type: 'game', characterId: gameContext.character.id },
                                extractedData: {},
                            };
                        }

                        const equipped = gameContext.inventory.filter(i => i.equippedAt);
                        const stored = gameContext.inventory.filter(i => !i.equippedAt);

                        let inventoryText = '🎒 **Ton inventaire**\n\n';

                        if (equipped.length > 0) {
                            inventoryText += '**🗡️ Équipé :**\n';
                            equipped.forEach(item => {
                                inventoryText += `- ${item.name} (${item.type})\n`;
                            });
                            inventoryText += '\n';
                        }

                        if (stored.length > 0) {
                            inventoryText += '**📦 Sac :**\n';
                            stored.forEach(item => {
                                inventoryText += `- ${item.name} x${item.quantity}\n`;
                            });
                        }

                        return {
                            aiMessage: inventoryText,
                            context: { type: 'game', characterId: gameContext.character.id },
                            extractedData: {},
                        };
                }
            }

            // Récupérer les 10 derniers messages (5 échanges)
            const rawMessages = await this.prisma.message.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { role: true, content: true },
            });

            // Normaliser les rôles au type attendu par OpenRouter
            const recentMessages: OpenRouterMessage[] = rawMessages
                .reverse()
                .map((m): OpenRouterMessage => ({
                    role: m.role === 'user' ? 'user' : 'assistant',
                    content: m.content,
                }));

            // Récupérer le contexte complet du jeu
            const gameContext = await this.gameStateService.getGameContext(
                sessionId,
                message,
            );

            // Construire le prompt système enrichi avec l'historique
            const systemPrompt = this.gameStateService.buildSystemPrompt(
                gameContext,
                recentMessages,
            );

            // Construire les messages pour l'API avec typage STRICT
            const apiMessages: OpenRouterMessage[] = [
                { role: 'system', content: systemPrompt },
                ...recentMessages,
                { role: 'user', content: message },
            ];

            const response = await this.openRouter.chatCompletion({
                model: AI_MODELS.NARRATION,
                messages: apiMessages,
                temperature: AI_TEMPERATURES.CREATIVE,
                max_tokens: 600,
            });

            const aiMessage = response.choices[0].message.content;

            // Stocker l'interaction comme mémoire narrative
            await this.embeddingsService.storeMemory({
                sessionId,
                type: 'NARRATIVE',
                content: `Joueur: ${message} | MJ: ${aiMessage.substring(0, 200)}${aiMessage.length > 200 ? '...' : ''}`,
                metadata: { characterId: gameContext.character.id },
            });

            return {
                aiMessage,
                context: {
                    type: 'game',
                    characterId: gameContext.character.id,
                },
                extractedData: {},
            };
        } catch (error) {
            console.error('❌ Game handler error:', error);

            if (error.message?.includes('Game session not found')) {
                const character = await this.prisma.character.findUnique({
                    where: { id: context.characterId },
                });

                if (character) {
                    console.log('🔄 Creating missing game session...');
                    await this.gameStateService.createGameSession(sessionId, character.id);

                    return {
                        aiMessage: '⚙️ Session de jeu initialisée. Tu peux maintenant jouer ! Que veux-tu faire ?',
                        context: {
                            type: 'game',
                            characterId: character.id,
                        },
                        extractedData: {},
                    };
                }
            }

            return {
                aiMessage: '❌ Une erreur est survenue avec le maître du jeu. Réessaie ou tape `/help`.',
                context: {
                    type: 'game',
                    characterId: context.characterId,
                },
                extractedData: {},
            };
        }
    }

    private async handleExploration(sessionId: string, message: string, context: any) {
        // TODO : Mécaniques spécifiques d'exploration (cartes, découvertes, etc.)
        return {
            aiMessage: '🗺️ Exploration en cours de développement...',
            context,
            extractedData: {},
        };
    }

    private async handleCombat(sessionId: string, message: string, context: any) {
        // TODO : Combat au tour par tour avec gestion d'état
        return {
            aiMessage: '⚔️ Combat en cours de développement...',
            context,
            extractedData: {},
        };
    }

    private async handleIdleChat(sessionId: string, message: string) {
        return this.handleWelcome(sessionId, message, { type: 'welcome' });
    }
}
