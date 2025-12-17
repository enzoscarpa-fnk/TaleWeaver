import { Injectable } from '@nestjs/common';
import { OpenRouterService } from '../openrouter/openrouter.service';
import { PrismaService } from '../prisma/prisma.service';

interface CreationStep {
    step: 'name' | 'class' | 'backstory' | 'stats' | 'complete';
    prompt: string;
    data?: Partial<any>;
}

export interface ParsedData {
    name?: string;
    class?: string;
    backstory?: string;
    strength?: number;
    intelligence?: number;
    agility?: number;
}

@Injectable()
export class CharacterCreationService {
    constructor(
        private openRouter: OpenRouterService,
        private prisma: PrismaService,
    ) {}

    async processCreationStep(
        sessionId: string,
        userMessage: string,
        currentStep: CreationStep,
    ) {
        console.log('📝 Step:', currentStep.step);
        console.log('💬 User message:', userMessage);
        console.log('📦 Current ', currentStep.data);

        // Parsing
        let parsedData: ParsedData = this.parseUserMessage(userMessage, currentStep.step);
        console.log('✅ Parsed from user:', parsedData);

        let shouldAdvance = Object.keys(parsedData).length > 0;

        // Si backstory générée par IA, on force l'avancement
        const needsAIBackstory = parsedData.backstory === '[AI_GENERATED]';

        let aiMessage = '';
        let nextStep: string = currentStep.step;

        if (shouldAdvance) {
            // Si on a parsé des données, génère le prompt du prochain step
            console.log('➡️ Data extracted, advancing to next step');
            nextStep = this.getNextStep(currentStep.step);

            // Merge les nouvelles données avec les anciennes
            const updatedData = { ...currentStep.data, ...parsedData };

            // Génère le prompt du prochain step avec toutes les données
            const nextPrompt = this.getSystemPromptForStep(nextStep, updatedData);
            console.log('📜 NEXT step prompt:', nextPrompt);

            const response = await this.openRouter.chatCompletion({
                model: 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: nextPrompt },
                    { role: 'user', content: 'Continue' },
                ],
                temperature: 0.7,
            });

            aiMessage = response.choices[0].message.content;
            console.log('🤖 AI response for NEXT step:', aiMessage);

        } else {
            // Rien parsé, reste sur le step actuel et redemande
            console.log('⚠️ Nothing parsed, staying on current step');

            const systemPrompt = this.getSystemPromptForStep(currentStep.step, currentStep.data);
            console.log('📜 CURRENT step prompt:', systemPrompt);

            const response = await this.openRouter.chatCompletion({
                model: 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
            });

            aiMessage = response.choices[0].message.content;
            console.log('🤖 AI response for CURRENT step:', aiMessage);
        }

        // Traitement AI-generated backstory (uniquement si on est au step backstory et que l'IA doit générer)
        if (needsAIBackstory && currentStep.step === 'backstory') {
            const lines = aiMessage.split('\n').filter(line => line.trim().length > 0);
            const longestLine = lines.reduce((longest, current) =>
                current.length > longest.length ? current : longest, '');

            if (longestLine && longestLine.length >= 50) {
                parsedData.backstory = longestLine.trim();
            } else {
                parsedData.backstory = aiMessage.trim();
            }
            console.log('🤖 AI generated backstory:', parsedData.backstory);

            // Force l'avancement au step suivant
            shouldAdvance = true;
            nextStep = this.getNextStep(currentStep.step);
        }

        console.log('🔄 Current step:', currentStep.step);
        console.log('🔄 Should advance:', shouldAdvance);
        console.log('🔄 Next step:', nextStep);

        return {
            aiMessage,
            nextStep,
            extractedData: parsedData,
        };
    }

    private parseUserMessage(userMessage: string, step: string): ParsedData {
        const content = userMessage.toLowerCase();

        switch (step) {
            case 'name':
                // Rejette les messages trop courts ou génériques
                if (content.length < 2 || ['oui', 'non', 'ok', 'yes', 'no'].includes(content)) {
                    return {};
                }

                const namePatterns = [
                    /(?:je m'appelle|mon nom est|je suis)\s+([a-zàâäéèêëïîôùûüÿæœç\s\-']+)/i,
                    /^([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÆŒÇ][a-zàâäéèêëïîôùûüÿæœç\-']+(?:\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÆŒÇ][a-zàâäéèêëïîôùûüÿæœç\-']+)*)$/,
                ];

                for (const pattern of namePatterns) {
                    const match = userMessage.match(pattern);
                    if (match) {
                        return { name: match[1].trim() };
                    }
                }

                const simpleNameMatch = userMessage.trim().match(/^([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÆŒÇa-zàâäéèêëïîôùûüÿæœç\-']{2,20})$/);
                if (simpleNameMatch) {
                    return { name: simpleNameMatch[1] };
                }
                break;

            case 'class':
                // Rejette explicitement les mots génériques
                if (['non', 'oui', 'ok', 'yes', 'no'].includes(content)) {
                    return {};
                }

                if (content.includes('marin') || content.includes('fer')) {
                    return { class: 'Marin de Fer' };
                }
                if (content.includes('navigateur') || content.includes('occulte')) {
                    return { class: 'Navigateur occulte' };
                }
                if (content.includes('bretteur') || content.includes('flot')) {
                    return { class: 'Bretteur des Flots' };
                }

                if (content.match(/\b1\b/) || content.includes('premier') || content.includes('première')) {
                    return { class: 'Marin de Fer' };
                }
                if (content.match(/\b2\b/) || content.includes('deuxième') || content.includes('second')) {
                    return { class: 'Navigateur occulte' };
                }
                if (content.match(/\b3\b/) || content.includes('troisième')) {
                    return { class: 'Bretteur des Flots' };
                }
                break;

            case 'backstory':
                // Détecte si l'utilisateur demande à l'IA de générer
                const requestsGeneration = ['oui', 'yes', 'ok', 'génère', 'invente', 'crée'].some(
                    keyword => content.includes(keyword)
                );

                if (requestsGeneration) {
                    // L'IA va générer une backstory dans sa réponse
                    // On parse sa propre réponse
                    return { backstory: '[AI_GENERATED]' }; // Marqueur spécial
                }

                if (userMessage.trim().length >= 15) {
                    return { backstory: userMessage.trim() };
                }
                break;

            case 'stats':
                const stats = {
                    strength: 0,
                    intelligence: 0,
                    agility: 0,
                };

                const forceMatch = content.match(/force[:\s]+\+?(\d+)|(\d+)\s+(?:en\s+)?force/i);
                const intMatch = content.match(/intelligence[:\s]+\+?(\d+)|(\d+)\s+(?:en\s+)?intelligence/i);
                const agilityMatch = content.match(/agilit[eé][:\s]+\+?(\d+)|(\d+)\s+(?:en\s+)?agilit[eé]/i);

                if (forceMatch) stats.strength = parseInt(forceMatch[1] || forceMatch[2]);
                if (intMatch) stats.intelligence = parseInt(intMatch[1] || intMatch[2]);
                if (agilityMatch) stats.agility = parseInt(agilityMatch[1] || agilityMatch[2]);

                if (stats.strength > 0 || stats.intelligence > 0 || stats.agility > 0) {
                    return stats;
                }
                break;
        }

        return {};
    }

    private getSystemPromptForStep(step: string, data?: any): string {
        const prompts = {
            name: `Tu es un vieux maître du jeu RPG dans une taverne de pirates.
                Un nouvel aventurier arrive pour créer son héros.
                Tu lui passes la bouteille de rhum pour qu'il se mette à l'aise.
                
                Demande-lui chaleureusement le nom qu'il souhaite donner à son personnage pirate.
                Propose 3 exemples de noms légendaires pour l'inspirer.
                Sois immersif mais concis (3-4 phrases).`,

            class: `Tu es un maître du jeu RPG. ${data?.name} a rejoint ta taverne.
        
                Présente-lui les 3 classes de pirates disponibles avec enthousiasme :
                
                1. **Marin de Fer** - Guerrier redoutable du combat rapproché (Force)
                2. **Navigateur occulte** - Sorcier des mers maîtrisant les arcanes maritimes (Intelligence)
                3. **Bretteur des Flots** - Duelliste agile et précis à l'épée (Agilité)
                
                ⚠️ IMPORTANT : Ne propose QUE ces 3 classes. N'invente aucune autre classe.
                
                Demande-lui de choisir en tapant 1, 2, 3 ou le nom de la classe.
                Ajoute une touche immersive mais reste fidèle aux 3 classes exactes.`,

            backstory: `Tu es un maître du jeu RPG. ${data?.name} est maintenant un ${data?.class}.
                    
                    Demande-lui de raconter l'histoire de son personnage : pourquoi a-t-il pris la mer ?
                    Qu'est-ce qui l'a poussé à devenir pirate ?
                    
                    S'il répond "génère" ou "oui", crée toi-même une backstory immersive et épique (2-3 phrases).
                    Sinon, accepte ce qu'il écrit.
                    
                    Sois chaleureux et encourage sa créativité.`,

            stats: `Tu es un maître du jeu RPG. ${data?.name} le ${data?.class} est presque prêt pour l'aventure !
                
                Il lui reste à répartir 15 points de bonus entre ses 3 caractéristiques :
                - **Force** : Puissance au combat rapproché
                - **Intelligence** : Maîtrise de la magie et résolution d'énigmes
                - **Agilité** : Rapidité, précision et dextérité
                
                Demande-lui sa répartition. Exemple : "Force: 7, Intelligence: 5, Agilité: 3"
                
                Ajoute une note immersive sur l'importance de ce choix pour son aventure.`,
        };

        return prompts[step] || prompts.name;
    }

    private getNextStep(currentStep: string): string {
        const stepOrder = ['name', 'class', 'backstory', 'stats', 'complete'];
        const currentIndex = stepOrder.indexOf(currentStep);
        return stepOrder[currentIndex + 1] || 'complete';
    }

    async finalizeCharacter(characterData: any) {
        console.log('🎉 Finalizing character:', characterData);

        return this.prisma.character.create({
            data: {
                name: characterData.name,
                class: characterData.class,
                backstory: characterData.backstory,
                strength: 10 + (characterData.strength || 0),
                intelligence: 10 + (characterData.intelligence || 0),
                agility: 10 + (characterData.agility || 0),
            },
        });
    }
}
