// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { CharacterCreationService } from '../characters/character-creation.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(
        private characterCreationService: CharacterCreationService,
        private prisma: PrismaService,
    ) {}

    async processMessage(sessionId: string, message: string, context: any) {
        console.log('💬 Processing message in context:', context?.type);

        // Détecte les commandes de changement de contexte
        if (message.startsWith('/')) {
            return this.handleCommand(sessionId, message, context);
        }

        // Route selon le contexte actif
        switch (context?.type) {
            case 'character-creation':
                return this.handleCharacterCreation(sessionId, message, context);

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
                aiMessage: '🏴‍☠️ Bienvenue dans la création de personnage ! Commençons par le nom de ton pirate.',
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
                context: { type: 'idle' },
                extractedData: {},
            };
        }

        // Commande d'aide
        if (cmd === '/help' || cmd === '/aide') {
            return {
                aiMessage: `**Commandes disponibles :**
                    - \`/create\` ou \`/créer\` : Créer un personnage
                    - \`/quit\` ou \`/quitter\` : Quitter le contexte actuel
                    - \`/help\` ou \`/aide\` : Afficher cette aide`,
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
                    aiMessage: `🎉 **Félicitations !** Ton personnage est prêt pour l'aventure !\n\n` +
                        `**${character.name}** - ${character.class}\n\n` +
                        `⚔️ Force: ${character.strength}\n` +
                        `🧠 Intelligence: ${character.intelligence}\n` +
                        `⚡ Agilité: ${character.agility}\n\n` +
                        `_${character.backstory}_\n\n` +
                        `Que les mers te soient favorables ! 🏴‍☠️\n\n` +
                        `Tape \`/help\` pour découvrir les commandes disponibles.`,
                    context: { type: 'idle' },
                    extractedData: result.extractedData,
                    character,
                };
            } catch (error) {
                console.error('❌ Finalization error:', error);
                return {
                    aiMessage: '❌ Une erreur est survenue lors de la sauvegarde de ton personnage. Réessaie avec `/create`.',
                    context: { type: 'idle' },
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

    private async handleExploration(sessionId: string, message: string, context: any) {
        // TODO : À implémenter plus tard
        return {
            aiMessage: 'Exploration en cours de développement...',
            context,
            extractedData: {},
        };
    }

    private async handleCombat(sessionId: string, message: string, context: any) {
        // TODO : À implémenter plus tard
        return {
            aiMessage: 'Combat en cours de développement...',
            context,
            extractedData: {},
        };
    }

    private async handleIdleChat(sessionId: string, message: string) {
        // Chat général sans contexte
        return {
            aiMessage: `Je suis le maître du jeu ! Tu peux :\n- Taper \`/create\` pour créer un personnage\n- Taper \`/help\` pour voir toutes les commandes`,
            context: { type: 'idle' },
            extractedData: {},
        };
    }
}
