import { Injectable } from '@nestjs/common';
import { OpenRouterService } from '../openrouter/openrouter.service';
import { PrismaService } from '../prisma/prisma.service';
import { AI_MODELS, AI_TEMPERATURES } from '../config/ai-models.config';

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

    /**
     * 🎭 Génère une réponse narrative immersive
     */
    private async getNarrativeResponse(prompt: string, temperature = AI_TEMPERATURES.CREATIVE): Promise<string> {
        const response = await this.openRouter.chatCompletion({
            model: AI_MODELS.NARRATION,
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: 300,
        });
        return response.choices[0].message.content.trim();
    }

    /**
     * 🔍 Extrait des données structurées avec haute précision
     */
    private async extractStructuredData(prompt: string): Promise<string> {
        const response = await this.openRouter.chatCompletion({
            model: AI_MODELS.PARSING,
            messages: [
                {
                    role: 'system',
                    content: 'Tu es un expert en extraction de données. Tu retournes UNIQUEMENT du JSON valide, sans texte additionnel.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: AI_TEMPERATURES.PRECISE,
            max_tokens: 200,
        });
        return response.choices[0].message.content.trim();
    }

    async processCreationStep(
        sessionId: string,
        userMessage: string,
        currentStep: CreationStep,
    ) {
        console.log('📝 Step:', currentStep.step);
        console.log('💬 User message:', userMessage);
        console.log('📦 Current ', currentStep.data);

        // 🔍 Parsing (avec fallback local si échec)
        let parsedData: ParsedData = await this.parseUserMessageWithAI(userMessage, currentStep.step, currentStep.data);

        // Fallback sur parsing local si l'IA échoue
        if (Object.keys(parsedData).length === 0) {
            console.log('⚠️ AI parsing failed, using local parser');
            parsedData = this.parseUserMessageLocal(userMessage, currentStep.step);
        }

        console.log('✅ Parsed from user:', parsedData);

        const needsAIBackstory = parsedData.backstory === '[AI_GENERATED]';
        let shouldAdvance = needsAIBackstory ? false : Object.keys(parsedData).length > 0;

        let aiMessage = '';
        let nextStep: string = currentStep.step;

        // 🎭 Traitement backstory générée
        if (needsAIBackstory && currentStep.step === 'backstory') {
            console.log('🤖 Generating backstory with narrative AI');

            const backstoryPrompt = `Génère une backstory épique de 2-3 phrases pour ce personnage pirate :
                Nom : ${currentStep.data?.name}
                Classe : ${currentStep.data?.class}
                
                Écris UNIQUEMENT l'histoire (origines, pourquoi il a pris la mer, motivations).
                Ton immersif et épique. Commence directement par l'histoire, sans introduction.`;

            parsedData.backstory = await this.getNarrativeResponse(backstoryPrompt, 0.8);
            console.log('🤖 AI generated backstory:', parsedData.backstory);

            shouldAdvance = true;
            nextStep = this.getNextStep(currentStep.step);

            const updatedData = { ...currentStep.data, ...parsedData };
            const nextPrompt = this.buildNarrativePromptForStep(nextStep, updatedData);
            const nextStepMessage = await this.getNarrativeResponse(nextPrompt);

            aiMessage = `📜 **Voici ton histoire :**\n\n${parsedData.backstory}\n\n---\n\n${nextStepMessage}`;
            console.log('🤖 Combined message:', aiMessage);

        } else if (shouldAdvance) {
            // ✅ Données parsées, génère le prompt du prochain step
            console.log('➡️ Data extracted, advancing to next step');
            nextStep = this.getNextStep(currentStep.step);

            const updatedData = { ...currentStep.data, ...parsedData };
            const nextPrompt = this.buildNarrativePromptForStep(nextStep, updatedData);
            console.log('📜 NEXT step prompt:', nextPrompt);

            aiMessage = await this.getNarrativeResponse(nextPrompt);
            console.log('🤖 AI response for NEXT step:', aiMessage);

        } else {
            // ⚠️ Rien parsé, reste sur le step actuel
            console.log('⚠️ Nothing parsed, staying on current step');

            const currentPrompt = this.buildNarrativePromptForStep(currentStep.step, currentStep.data);
            console.log('📜 CURRENT step prompt:', currentPrompt);

            aiMessage = await this.getNarrativeResponse(currentPrompt);
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

    /**
     * 🔍 Parse avec IA (GPT-4o pour précision)
     */
    private async parseUserMessageWithAI(userMessage: string, step: string, data?: any): Promise<ParsedData> {
        const extractionPrompts = {
            name: `Extrait le nom du personnage depuis ce message : "${userMessage}".
                Retourne UNIQUEMENT ce JSON : {"name": "nom_extrait"}
                Si aucun nom valide n'est détecté, retourne : {}`,

            class: `L'utilisateur a choisi une classe : "${userMessage}".
                Classes valides :
                - "Marin de Fer" (choix 1, mots-clés: marin, fer, guerrier)
                - "Navigateur occulte" (choix 2, mots-clés: navigateur, occulte, sorcier)
                - "Bretteur des Flots" (choix 3, mots-clés: bretteur, flots, duelliste)
                
                Retourne UNIQUEMENT ce JSON : {"class": "nom_exact_classe"}
                Si aucune classe valide, retourne : {}`,

            backstory: `Analyse ce message : "${userMessage}".
                Si l'utilisateur demande de générer (mots-clés: oui, génère, invente, crée), retourne : {"backstory": "[AI_GENERATED]"}
                Si c'est une backstory écrite (min 15 caractères), retourne : {"backstory": "texte_complet"}
                Sinon retourne : {}`,

            stats: `Extrait les statistiques depuis : "${userMessage}".
                Le joueur doit répartir exactement 15 points entre Force, Intelligence, Agilité.
                
                Formats possibles :
                - "Force: 7, Intelligence: 5, Agilité: 3"
                - "7 5 3" (dans l'ordre Force Intelligence Agilité)
                
                Retourne UNIQUEMENT ce JSON : {"strength": X, "intelligence": Y, "agility": Z}
                Vérifie que X + Y + Z = 15 et que chaque valeur est entre 0 et 15.
                Si invalide, retourne : {}`,
        };

        const prompt = extractionPrompts[step];
        if (!prompt) return {};

        try {
            const rawResponse = await this.extractStructuredData(prompt);

            // Nettoie la réponse (enlève markdown, backticks, etc.)
            let cleanedResponse = rawResponse;

            cleanedResponse = cleanedResponse.replace(/```json/g, '');
            cleanedResponse = cleanedResponse.replace(/```/g, '');
            cleanedResponse = cleanedResponse.trim();

            const parsed = JSON.parse(cleanedResponse);
            console.log('🔍 AI parsed ', parsed);
            return parsed;
        } catch (error) {
            console.error('❌ AI parsing error:', error);
            return {};
        }
    }

    /**
     * 📝 Parser local (fallback si l'IA échoue)
     */
    private parseUserMessageLocal(userMessage: string, step: string): ParsedData {
        const content = userMessage.toLowerCase();

        switch (step) {
            case 'name':
                if (content.length < 2 || ['oui', 'non', 'ok', 'yes', 'no'].includes(content)) {
                    return {};
                }

                const namePatterns = [
                    /(?:je m'appelle|mon nom est|je suis)\s+([a-zàâäéèêëïîôùûüÿæœç\s\-']+)/i,
                    /^([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÆŒÇ][a-zàâäéèêëïîôùûüÿæœç\-']+(?:\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÆŒÇ][a-zàâäéèêëïîôùûüÿæœç\-']+)*)$/,
                ];

                for (const pattern of namePatterns) {
                    const match = userMessage.match(pattern);
                    if (match) return { name: match[1].trim() };
                }

                const simpleNameMatch = userMessage.trim().match(/^([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÆŒÇa-zàâäéèêëïîôùûüÿæœç\-']{2,20})$/);
                if (simpleNameMatch) return { name: simpleNameMatch[1] };
                break;

            case 'class':
                if (['non', 'oui', 'ok', 'yes', 'no'].includes(content)) return {};

                if (content.includes('marin') || content.includes('fer')) {
                    return { class: 'Marin de Fer' };
                }
                if (content.includes('navigateur') || content.includes('occulte')) {
                    return { class: 'Navigateur occulte' };
                }
                if (content.includes('bretteur') || content.includes('flot')) {
                    return { class: 'Bretteur des Flots' };
                }

                if (content.match(/\b1\b/) || content.includes('premier')) {
                    return { class: 'Marin de Fer' };
                }
                if (content.match(/\b2\b/) || content.includes('deuxième')) {
                    return { class: 'Navigateur occulte' };
                }
                if (content.match(/\b3\b/) || content.includes('troisième')) {
                    return { class: 'Bretteur des Flots' };
                }
                break;

            case 'backstory':
                const requestsGeneration = ['oui', 'yes', 'ok', 'génère', 'invente', 'crée'].some(
                    keyword => content.includes(keyword)
                );

                if (requestsGeneration) return { backstory: '[AI_GENERATED]' };
                if (userMessage.trim().length >= 15) return { backstory: userMessage.trim() };
                break;

            case 'stats':
                const stats = { strength: 0, intelligence: 0, agility: 0 };

                const simpleMatch = userMessage.trim().match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s*$/);
                if (simpleMatch) {
                    stats.strength = parseInt(simpleMatch[1]);
                    stats.intelligence = parseInt(simpleMatch[2]);
                    stats.agility = parseInt(simpleMatch[3]);
                } else {
                    const forceMatch = content.match(/force[:\s]+(\d+)/i);
                    const intMatch = content.match(/intelligence[:\s]+(\d+)/i);
                    const agilityMatch = content.match(/agil(?:it[ée]|ity)[:\s]+(\d+)/i);

                    if (forceMatch) stats.strength = parseInt(forceMatch[1]);
                    if (intMatch) stats.intelligence = parseInt(intMatch[1]);
                    if (agilityMatch) stats.agility = parseInt(agilityMatch[1]);
                }

                const total = stats.strength + stats.intelligence + stats.agility;
                const allPositive = stats.strength >= 0 && stats.intelligence >= 0 && stats.agility >= 0;
                const allValid = stats.strength <= 15 && stats.intelligence <= 15 && stats.agility <= 15;

                if (total === 15 && allPositive && allValid && (stats.strength > 0 || stats.intelligence > 0 || stats.agility > 0)) {
                    return stats;
                }
                return {};
        }

        return {};
    }

    /**
     * 🎭 Construit le prompt narratif pour chaque étape
     */
    private buildNarrativePromptForStep(step: string, data?: any): string {
        const prompts = {
            name: `Tu es un vieux maître du jeu RPG dans une taverne de pirates.
                Un nouvel aventurier arrive pour créer son héros.
                
                Demande-lui chaleureusement le nom qu'il souhaite donner à son personnage pirate.
                Propose 3 exemples de noms légendaires pour l'inspirer.
                Sois immersif mais concis (3-4 phrases).`,

            class: `Tu es un maître du jeu RPG. ${data?.name} a rejoint ta taverne.

                Présente-lui les 3 classes de pirates disponibles avec enthousiasme :
                
                1. **Marin de Fer** - Guerrier redoutable du combat rapproché (Force)
                2. **Navigateur occulte** - Sorcier des mers maîtrisant les arcanes maritimes (Intelligence)
                3. **Bretteur des Flots** - Duelliste agile et précis à l'épée (Agilité)
                
                Demande-lui de choisir en tapant 1, 2, 3 ou le nom de la classe.
                Ajoute une touche immersive (3-4 phrases).`,

            backstory: `Tu es un maître du jeu RPG. ${data?.name} est maintenant un ${data?.class}.
                
                Demande-lui de raconter l'histoire de son personnage : pourquoi a-t-il pris la mer ?
                
                S'il répond "génère", tu généreras une backstory pour lui.
                Sinon, accepte ce qu'il écrit (minimum 15 caractères).
                
                Sois chaleureux et encourage sa créativité (2-3 phrases).`,

            stats: `${data?.name} le ${data?.class}, il est temps de répartir tes 15 points !

                Répartis-les entre Force, Intelligence et Agilité.
                
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
