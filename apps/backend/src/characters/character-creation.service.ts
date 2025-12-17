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

        // Si backstory à générer, ne pas considérer comme "shouldAdvance"
        const needsAIBackstory = parsedData.backstory === '[AI_GENERATED]';
        let shouldAdvance = needsAIBackstory ? false : Object.keys(parsedData).length > 0;

        let aiMessage = '';
        let nextStep: string = currentStep.step;

        // Traitement backstory générée : Appel dédié pour générer une backstory pure
        if (needsAIBackstory && currentStep.step === 'backstory') {
            console.log('🤖 Generating backstory with dedicated prompt');

            // Prompt système strict
            const backstorySystemPrompt = `Tu es un narrateur de RPG. Tu génères UNIQUEMENT des backstories de personnages.

                RÈGLES ABSOLUES :
                - N'écris QUE l'histoire du personnage
                - JAMAIS de "Voici", "Bien sûr", "Ah", etc.
                - JAMAIS de questions à la fin
                - JAMAIS de commentaires méta
                - Commence DIRECTEMENT par l'histoire narrative
                - 2-3 phrases maximum
                - Ton immersif et épique`;

            // Message user qui donne le contexte
            const backstoryUserPrompt = `Génère le backstory pour :
                Nom : ${currentStep.data?.name}
                Classe : ${currentStep.data?.class}
                
                Écris uniquement l'histoire (origines, pourquoi il a pris la mer, motivations).`;

            const backstoryResponse = await this.openRouter.chatCompletion({
                model: 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: backstorySystemPrompt },
                    { role: 'user', content: backstoryUserPrompt },
                ],
                temperature: 0.7,
                max_tokens: 200,
            });

            parsedData.backstory = backstoryResponse.choices[0].message.content.trim();
            console.log('🤖 AI generated backstory:', parsedData.backstory);

            // Maintenant génère le message pour l'utilisateur (step suivant)
            shouldAdvance = true;
            nextStep = this.getNextStep(currentStep.step);

            // Génère le prompt du step stats
            const updatedData = { ...currentStep.data, ...parsedData };
            const nextPrompt = this.getSystemPromptForStep(nextStep, updatedData);

            const nextStepResponse = await this.openRouter.chatCompletion({
                model: 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: nextPrompt },
                    { role: 'user', content: 'Continue' },
                ],
                temperature: 0.7,
            });

            // Combine le backstory généré + le message du step stats
            aiMessage = `📜 **Voici ton histoire :**\n\n${parsedData.backstory}\n\n---\n\n${nextStepResponse.choices[0].message.content}`;
            console.log('🤖 Combined message:', aiMessage);

        } else if (shouldAdvance) {
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

                // Pattern 1 : "Force: 5, Intelligence: 7, Agilité: 3"
                const forceMatch = content.match(/force[:\s]+\+?(\d+)|(\d+)\s+(?:en\s+)?force/i);
                const intMatch = content.match(/intelligence[:\s]+\+?(\d+)|(\d+)\s+(?:en\s+)?intelligence/i);
                const agilityMatch = content.match(/agilit[eé][:\s]+\+?(\d+)|(\d+)\s+(?:en\s+)?agilit[eé]/i);

                if (forceMatch) stats.strength = parseInt(forceMatch[1] || forceMatch[2]);
                if (intMatch) stats.intelligence = parseInt(intMatch[1] || intMatch[2]);
                if (agilityMatch) stats.agility = parseInt(agilityMatch[1] || agilityMatch[2]);

                // Pattern 2 : 3 nombres séparés par espaces
                if (stats.strength === 0 && stats.intelligence === 0 && stats.agility === 0) {
                    const numbersOnly = content.match(/^(\d+)\s+(\d+)\s+(\d+)$/);
                    if (numbersOnly) {
                        stats.strength = parseInt(numbersOnly[1]);
                        stats.intelligence = parseInt(numbersOnly[2]);
                        stats.agility = parseInt(numbersOnly[3]);
                        console.log('🎲 Parsed as "X Y Z" format:', stats);
                    }
                }

                // Validation : Total = 15, toutes positives, max 15 par stat
                const total = stats.strength + stats.intelligence + stats.agility;
                const allPositive = stats.strength >= 0 && stats.intelligence >= 0 && stats.agility >= 0;
                const allValid = stats.strength <= 15 && stats.intelligence <= 15 && stats.agility <= 15;

                console.log('🎲 Stats parsed:', stats, 'Total:', total);

                if (total === 15 && allPositive && allValid && (stats.strength > 0 || stats.intelligence > 0 || stats.agility > 0)) {
                    console.log('✅ Stats validated!');
                    return stats;
                }

                console.log('❌ Stats invalid - staying on stats step');
                return {};
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
                    
                    S'il répond "génère", tu généreras une backstory pour lui.
                    Sinon, accepte ce qu'il écrit (minimum 15 caractères).
                    
                    Sois chaleureux et encourage sa créativité (2-3 phrases).`,

            stats: `Tu es un maître du jeu RPG. ${data?.name} le ${data?.class} est presque prêt pour l'aventure !

                    Il lui reste à répartir **exactement 15 points** entre ses 3 caractéristiques :
                    - **Force** : Puissance au combat rapproché (0-15)
                    - **Intelligence** : Maîtrise de la magie et résolution d'énigmes (0-15)
                    - **Agilité** : Rapidité, précision et dextérité (0-15)
                    
                    ⚠️ RÈGLES :
                    - Le total DOIT faire exactement 15 points
                    - Chaque stat doit être entre 0 et 15
                    
                    Formats acceptés :
                    - "Force: 7, Intelligence: 5, Agilité: 3"
                    - "7 5 3" (Force Intelligence Agilité)
                    
                    Ajoute une note immersive mais reste bref (2-3 phrases max).`,
        };

        return prompts[step] || prompts.name;
    }

    private getNextStep(currentStep: string): string {
        const stepOrder = ['name', 'class', 'backstory', 'stats', 'complete'];
        const currentIndex = stepOrder.indexOf(currentStep);
        const next = stepOrder[currentIndex + 1];

        console.log(`🔄 getNextStep: ${currentStep} → ${next}`);

        return next || 'complete';
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
