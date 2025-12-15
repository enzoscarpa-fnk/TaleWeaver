import { Injectable } from '@nestjs/common';
import { OpenRouterService } from '../openrouter/openrouter.service';
import { PrismaService } from '../prisma/prisma.service';

interface CreationStep {
    step: 'name' | 'class' | 'backstory' | 'stats' | 'complete';
    prompt: string;
    data?: Partial<any>;
}

@Injectable()
export class CharacterCreationService {
    constructor(
        private openRouter: OpenRouterService,
        private prisma: PrismaService,
    ) {}

    // Système de conversation guidée
    async processCreationStep(
        sessionId: string,
        userMessage: string,
        currentStep: CreationStep,
    ) {
        const systemPrompt = this.getSystemPromptForStep(currentStep.step);

        const response = await this.openRouter.chatCompletion({
            model: 'openai/gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
        });

        // Parse à la fois la réponse de l'IA et le message utilisateur
        let parsedData = this.parseAIResponse(response, currentStep.step);

        // Pour la classe, vérifie aussi le message utilisateur
        if (currentStep.step === 'class' && !parsedData.class) {
            parsedData = this.parseUserMessage(userMessage, currentStep.step);
        }

        return {
            aiMessage: response.choices[0].message.content,
            nextStep: this.getNextStep(currentStep.step),
            extractedData: parsedData,
        };
    }

    // Méthode pour parser le message utilisateur
    private parseUserMessage(userMessage: string, step: string): any {
        const content = userMessage.toLowerCase();

        if (step === 'class') {
            if (content.includes('marin') && content.includes('fer')) {
                return { class: 'Marin de Fer' };
            }
            if (content.includes('navigateur') || content.includes('occulte')) {
                return { class: 'Navigateur occulte' };
            }
            if (content.includes('bretteur') || content.includes('flot')) {
                return { class: 'Bretteur des Flots' };
            }
        }

        return {};
    }


    private getSystemPromptForStep(step: string): string {
        const prompts = {
            name: `Tu es un maître du jeu RPG. Aide le joueur à choisir un nom de héros. 
             Le joueur incarnera un personnage issu de l'univers des pirates. Demandes-lui le nom qu'il aimerais donner à son personnage en proposant 3 noms adaptés.
             Réponds de manière immersive et engageante.`,

            class: `Tu es un maître du jeu RPG. Le joueur a choisi son nom.
              Présente-lui les 3 classes disponibles: Marin de Fer (force), Navigateur occulte (intelligence), 
              Bretteur des Flots (agilité). Décris leurs capacités de manière immersive.`,

            backstory: `Tu es un maître du jeu RPG. Le joueur a choisi sa classe.
                  Aide-le à créer une backstory courte (2-3 phrases) qui explique 
                  pourquoi son personnage s'est lancé dans l'aventure.`,

            stats: `Tu es un maître du jeu RPG. Le joueur a son personnage de base.
              Il doit maintenant répartir 15 points bonus entre Force, Intelligence et Agilité.
              Explique comment chaque stat influence le gameplay et aide-le à faire un choix cohérent 
              avec sa classe. Format: Force: +X, Intelligence: +Y, Agilité: +Z`,
        };

        return prompts[step] || prompts.name;
    }

    private parseAIResponse(response: any, step: string): any {
        const content = response.choices[0].message.content;

        // Extraction basique avec regex (à améliorer selon les besoins)
        switch (step) {
            case 'name':
                // Cherche un nom entre guillemets ou en gras
                const nameMatch = content.match(/"([^"]+)"|\*\*([^*]+)\*\*/);
                return nameMatch ? { name: nameMatch[1] || nameMatch[2] } : {};

            case 'class':
                // Cherche des mots-clés de classe
                const classMatch = content.toLowerCase();
                if (classMatch.includes('marin de fer') || classMatch.includes('marin')) {
                    return { class: 'Marin de Fer' };
                }
                if (classMatch.includes('navigateur occulte') || classMatch.includes('navigateur')) {
                    return { class: 'Navigateur occulte' };
                }
                if (classMatch.includes('bretteur des flots') || classMatch.includes('bretteur')) {
                    return { class: 'Bretteur des Flots' };
                }
                return {};

            case 'stats':
                // Cherche des patterns comme "Force : +5"
                const stats = {
                    strength: 0,
                    intelligence: 0,
                    agility: 0,
                };
                const strengthMatch = content.match(/Force:\s*\+?(\d+)/i);
                const intMatch = content.match(/Intelligence:\s*\+?(\d+)/i);
                const agilityMatch = content.match(/Agilit[eé]:\s*\+?(\d+)/i);

                if (strengthMatch) stats.strength = parseInt(strengthMatch[1]);
                if (intMatch) stats.intelligence = parseInt(intMatch[1]);
                if (agilityMatch) stats.agility = parseInt(agilityMatch[1]);

                return stats;

            default:
                return {};
        }
    }

    private getNextStep(currentStep: string): string {
        const stepOrder = ['name', 'class', 'backstory', 'stats', 'complete'];
        const currentIndex = stepOrder.indexOf(currentStep);
        return stepOrder[currentIndex + 1] || 'complete';
    }

    // Finalise la création et sauvegarde en DB
    async finalizeCharacter(characterData: any) {
        return this.prisma.character.create({
        data: {
            name: characterData.name,
            class: characterData.class,
            backstory: characterData.backstory,
            // Stats de base + bonus attribués
            strength: 10 + (characterData.bonusStrength || 0),
            intelligence: 10 + (characterData.bonusIntelligence || 0),
            agility: 10 + (characterData.bonusAgility || 0),
        },
    });
    }
}
