import { Injectable } from '@nestjs/common';
import { CharacterCreationService } from '../characters/character-creation.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenRouterService } from '../openrouter/openrouter.service';
import { AI_MODELS, AI_TEMPERATURES } from '../config/ai-models.config';

@Injectable()
export class ChatService {
    constructor(
        private characterCreationService: CharacterCreationService,
        private prisma: PrismaService,
        private openRouter: OpenRouterService,
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
                '- \`/create\` ou \`/créer\` : Créer un personnage\n' +
                '- \`/quit\` ou \`/quitter\` : Quitter le contexte actuel\n' +
                '- \`/help\` ou \`/aide\` : Afficher cette aide\n\n' +
                '**🎮 Comment jouer :**\n' +
                'Si tu n\'as pas encore de personnage, commence par \`/create\`.\n' +
                'Sinon, parle normalement pour interagir avec le monde !',
                context: currentContext,
                extractedData: {},
            };
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
            // Si le joueur a déjà un personnage, passe directement au jeu
            const character = characters[0];

            return {
                aiMessage: '**Bienvenue à bord, ${character.name} !** 🏴‍☠️\n' +
                'Ta légende commence ici, dans les eaux tumultueuses des Caraïbes. Ton navire tangue doucement au port, l\'équipage attend tes ordres.\n' +
                'Que veux-tu faire ?',
                context: {
                    type: 'game',
                    characterId: character.id,
                },
                extractedData: {},
            };
        } else {
            // Sinon, propose de créer un personnage
            return {
                aiMessage: '⚓ **Bienvenue dans TaleWeaver !**\n\n' +
                'Dans ce jeu de rôle pirate, tu incarnes un flibustier intrépide naviguant sur les sept mers.\n' +
                'Explore des îles mystérieuses, affronte des dangers et forge ta légende !\n\n' +
                '**📜 Les bases :**\n' +
                '- Crée ton personnage avec ses compétences uniques\n' +
                '- Explore le monde en parlant naturellement au maître du jeu\n' +
                '- Tes choix déterminent ton destin\n\n' +
                'Pour commencer ton aventure, tape \`/create\` pour créer ton personnage ! 🏴‍☠️',
                context: { type: 'welcome' },
                extractedData: {},
            };
        }
    }

    private async handleCharacterCreation(sessionId: string, message: string, context: any) {
        // Utilise context.mergedData si présent (compatibilité avec les retours précédents)
        const currentData = context.mergedData || context.data || {};

        console.log('📦 Processing with ', currentData);

        // Délègue au service de création existant
        const result = await this.characterCreationService.processCreationStep(
            sessionId,
            message,
            {
                step: context.step as any,
                prompt: '',
                data: currentData,
            },
        );

        // Fusionne TOUTES les données (anciennes + nouvelles)
        const mergedData = { ...currentData, ...result.extractedData };
        console.log('📦 Merged ', mergedData);

        // Si création terminée (step = complete), finalise et sauvegarde en DB
        if (result.nextStep === 'complete') {
            console.log('🎉 Character creation complete, finalizing...');
            console.log('📦 Final character ', mergedData);

            try {
                const character = await this.characterCreationService.finalizeCharacter(mergedData);

                return {
                    aiMessage: '🎉 **Félicitations !** Ton personnage est prêt pour l\'aventure !\n\n' +
                    `**${character.name}**` +' - ' + `${character.class}` + '\n\n' +
                    '⚔️ Force: ' + `${character.strength}` + '\n' +
                    '🧠 Intelligence: ' + `${character.intelligence}`+ '\n' +
                    '⚡ Agilité: ' + `${character.agility}`+ '\n\n' +
                    `_${character.backstory}_` + '\n\n' +
                    '---\n\n' +
                    '**Que les mers te soient favorables ! 🏴‍☠️**\n\n' +
                    'Ton navire est amarré au port de Tortuga. L\'équipage attend tes ordres, capitaine. Que veux-tu faire ?',
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

        // Sinon, mise à jour du contexte de création avec mergedData
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
        const character = await this.prisma.character.findUnique({
            where: { id: context.characterId },
        });

        if (!character) {
            return {
                aiMessage: '❌ Erreur : personnage introuvable. Tape `/create` pour en créer un nouveau.',
                context: { type: 'welcome' },
                extractedData: {},
            };
        }

        const recentMessages = await this.prisma.message.findMany({
            where: { sessionId: sessionId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        const conversationHistory = recentMessages
            .reverse()
            .map(m => `${m.role === 'user' ? 'Joueur' : 'MJ'}: ${m.content}`)
            .join('\n');

        const systemPrompt = `Tu es un maître du jeu pour un RPG pirate immersif et épique.

        **Personnage du joueur :**
        - Nom : ${character.name}
        - Classe : ${character.class}
        - Force : ${character.strength}, Intelligence : ${character.intelligence}, Agilité : ${character.agility}
        - Niveau : ${character.level}
        - Histoire : ${character.backstory}
        
        **Ton rôle :**
        - Décris les scènes avec détails immersifs (lieux, personnages, ambiance)
        - Propose 2-3 choix d'actions au joueur quand pertinent
        - Adapte la difficulté aux stats du personnage
        - Fais vivre l'univers pirate (tavernes, combats navals, trésors, tempêtes, personnages colorés)
        - Réponds aux actions du joueur de manière logique et épique
        - Gère les combats, les énigmes, les dialogues avec PNJ
        - Récompense la créativité et les bonnes stratégies
        
        **Style :**
        - Ton narratif et épique mais accessible
        - Descriptions courtes mais évocatrices (4-5 phrases max par réponse)
        - Propose toujours des choix ou demande ce que le joueur veut faire ensuite
        - Utilise du Markdown pour la mise en forme (**gras** pour important, _italique_ pour pensées)
        - Emoji occasionnels pour l'ambiance (⚔️🏴‍☠️🌊💀⚓🗡️)
        
        ${conversationHistory ? `**Historique récent :**\n${conversationHistory}\n\n` : ''}Le joueur dit maintenant : "${message}"`;

        try {
            const response = await this.openRouter.chatCompletion({
                model: AI_MODELS.NARRATION, // Mistral Creative pour narration
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message },
                ],
                temperature: AI_TEMPERATURES.CREATIVE, // 0.8
                max_tokens: 500,
            });

            const aiMessage = response.choices[0].message.content;

            return {
                aiMessage,
                context: {
                    type: 'game',
                    characterId: character.id,
                },
                extractedData: {},
            };
        } catch (error) {
            console.error('❌ Game AI error:', error);
            return {
                aiMessage: '❌ Une erreur est survenue avec le maître du jeu. Réessaie ou tape `/help`.',
                context: {
                    type: 'game',
                    characterId: character.id,
                },
                extractedData: {},
            };
        }
    }

    private async handleExploration(sessionId: string, message: string, context: any) {
        // TODO : À implémenter plus tard pour des mécaniques spécifiques d'exploration
        return {
            aiMessage: 'Exploration en cours de développement...',
            context,
            extractedData: {},
        };
    }

    private async handleCombat(sessionId: string, message: string, context: any) {
        // TODO : À implémenter plus tard pour des mécaniques de combat au tour par tour
        return {
            aiMessage: 'Combat en cours de développement...',
            context,
            extractedData: {},
        };
    }

    private async handleIdleChat(sessionId: string, message: string) {
        // Passe en mode welcome pour le premier message
        return this.handleWelcome(sessionId, message, { type: 'welcome' });
    }
}
