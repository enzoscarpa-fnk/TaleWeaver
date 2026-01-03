import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService, MemorySearchResult } from '../embeddings/embeddings.service';
import { QuestStatus, ItemType } from '@prisma/client';

export interface GameContext {
    session: any;
    character: any;
    combat?: any;
    activeQuests: any[];
    inventory: any[];
    recentMemories: MemorySearchResult[];
}

export interface CombatEnemy {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
}

export interface QuestObjective {
    id: string;
    description: string;
    completed: boolean;
}

@Injectable()
export class GameStateService {
    constructor(
        private prisma: PrismaService,
        private embeddingsService: EmbeddingsService,
    ) {}

    /**
     * Initialise une nouvelle session de jeu
     */
    async createGameSession(conversationId: string, characterId: string) {
        const character = await this.prisma.character.findUnique({
            where: { id: characterId },
        });

        if (!character) {
            throw new NotFoundException('Character not found');
        }

        const session = await this.prisma.gameSession.create({
            data: {
                conversationId,
                characterId,
                currentLocation: 'Port de Tortuga',
                gold: 100,
                reputation: 0,
            },
            include: {
                character: true,
            },
        });

        // Ajouter des items de départ
        await this.addItemToInventory(session.id, {
            itemId: 'starter_sword',
            name: 'Épée rouillée',
            type: ItemType.WEAPON,
            quantity: 1,
            properties: { damage: 10 },
        });

        await this.addItemToInventory(session.id, {
            itemId: 'health_potion',
            name: 'Potion de soin',
            type: ItemType.CONSUMABLE,
            quantity: 3,
            properties: { healing: 50 },
        });

        console.log(`✅ Game session created: ${session.id}`);
        return session;
    }

    /**
     * Récupère le contexte complet du jeu pour le modèle de chat
     */
    async getGameContext(
        conversationId: string,
        userInput?: string,
    ): Promise<GameContext> {
        const session = await this.prisma.gameSession.findUnique({
            where: { conversationId },
            include: {
                character: true,
                combat: true,
                quests: {
                    where: { status: QuestStatus.ACTIVE },
                },
                inventory: true,
            },
        });

        // Vérification explicite de null
        if (!session) {
            throw new NotFoundException('Game session not found');
        }

        // Récupérer les mémoires pertinentes si on a un input
        let recentMemories: MemorySearchResult[] = [];
        if (userInput) {
            recentMemories = await this.embeddingsService.searchMemories(
                conversationId,
                userInput,
                5,
            );
        } else {
            recentMemories = await this.embeddingsService.getRecentMemories(
                conversationId,
                5,
            );
        }

        return {
            session,
            character: session.character,
            combat: session.combat || undefined,
            activeQuests: session.quests,
            inventory: session.inventory,
            recentMemories,
        };
    }

    /**
     * Construit le prompt système enrichi pour le modèle de chat
     */
    buildSystemPrompt(context: GameContext): string {
        const { session, character, combat, activeQuests, inventory, recentMemories } = context;

        // Partie 1 : Stats du personnage
        let prompt = `Tu es le maître du jeu d'un RPG pirate immersif.

            **Personnage : ${character.name}**
            - Classe : ${character.class}
            - Niveau : ${character.level} | XP : ${character.experience}
            - PV : ${character.health}/${character.maxHealth}
            - Mana : ${character.mana}/${character.maxMana}
            - Force : ${character.strength} | Intelligence : ${character.intelligence} | Agilité : ${character.agility}
            - Or : ${session.gold} pièces
            - Réputation : ${session.reputation}
            
            **Localisation actuelle :** ${session.currentLocation}
            `;

        // Partie 2 : Combat actif
        if (combat?.isActive) {
            const enemies: CombatEnemy[] = JSON.parse(combat.enemies);
            prompt += `\n**COMBAT EN COURS (Tour ${combat.currentTurn})**
                - PV du joueur : ${combat.playerHP}/${combat.playerMaxHP}
                - Ennemis :
                ${enemies.map(e => `  • ${e.name} (${e.hp}/${e.maxHp} PV)`).join('\n')}
                `;
        }

        // Partie 3 : Quêtes actives
        if (activeQuests.length > 0) {
            prompt += `\n**Quêtes actives :**\n`;
            activeQuests.forEach(q => {
                const objectives: QuestObjective[] = JSON.parse(q.objectives);
                const completed = objectives.filter(o => o.completed).length;
                prompt += `- ${q.name} (${completed}/${objectives.length})\n`;
                objectives.forEach(obj => {
                    prompt += `  ${obj.completed ? '✅' : '⏳'} ${obj.description}\n`;
                });
            });
        }

        // Partie 4 : Inventaire
        const equippedItems = inventory.filter(i => i.equippedAt);
        const storedItems = inventory.filter(i => !i.equippedAt);

        if (equippedItems.length > 0) {
            prompt += `\n**Équipement :**\n`;
            equippedItems.forEach(item => {
                prompt += `- ${item.name} (${item.type})\n`;
            });
        }

        if (storedItems.length > 0) {
            prompt += `\n**Inventaire :**\n`;
            storedItems.forEach(item => {
                prompt += `- ${item.name} x${item.quantity}\n`;
            });
        }

        // Partie 5 : Mémoire narrative
        if (recentMemories.length > 0) {
            prompt += `\n**Événements pertinents du passé :**\n`;
            recentMemories.forEach((m, i) => {
                prompt += `${i + 1}. [${m.type}] ${m.content} (pertinence: ${(m.similarity * 100).toFixed(0)}%)\n`;
            });
        }

        // Partie 6 : Instructions pour le MJ
        prompt += `\n**Ton rôle de Maître du Jeu :**
            - Décris les scènes avec détails immersifs
            - Tiens compte de l'historique et des stats du personnage
            - Adapte la difficulté aux compétences du joueur
            - Propose des choix significatifs
            - Gère les combats, dialogues NPCs, et exploration
            - Récompense la créativité
            
            **Style narratif :**
            - Ton épique mais accessible
            - Descriptions concises (4-5 phrases max)
            - Utilise Markdown (**gras** pour important, _italique_ pour ambiance)
            - Emoji occasionnels (⚔️🏴‍☠️🌊💀⚓)
            `;

        return prompt;
    }

    // ========== GESTION DES QUÊTES ==========

    async addQuest(sessionId: string, questData: {
        questId: string;
        name: string;
        description: string;
        objectives: QuestObjective[];
        goldReward?: number;
        xpReward?: number;
    }) {
        const quest = await this.prisma.quest.create({
            data: {
                sessionId,
                questId: questData.questId,
                name: questData.name,
                description: questData.description,
                objectives: JSON.stringify(questData.objectives),
                goldReward: questData.goldReward || 0,
                xpReward: questData.xpReward || 0,
            },
        });

        // Récupérer la session pour avoir le conversationId
        const session = await this.prisma.gameSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException('Game session not found');
        }

        // Stocker en mémoire narrative
        await this.embeddingsService.storeMemory({
            sessionId: session.conversationId,
            type: 'NARRATIVE',
            content: `Nouvelle quête acceptée : ${questData.name}`,
            metadata: { questId: questData.questId },
        });

        return quest;
    }

    async updateQuestObjective(
        sessionId: string,
        questId: string,
        objectiveId: string,
        completed: boolean,
    ) {
        const quest = await this.prisma.quest.findFirst({
            where: { sessionId, questId },
        });

        if (!quest) {
            throw new NotFoundException('Quest not found');
        }

        const objectives: QuestObjective[] = JSON.parse(quest.objectives);
        const objective = objectives.find(o => o.id === objectiveId);

        if (!objective) {
            throw new NotFoundException('Objective not found');
        }

        objective.completed = completed;

        // Vérifier si tous les objectifs sont complétés
        const allCompleted = objectives.every(o => o.completed);
        const status = allCompleted ? QuestStatus.COMPLETED : QuestStatus.ACTIVE;

        const updatedQuest = await this.prisma.quest.update({
            where: { id: quest.id },
            data: {
                objectives: JSON.stringify(objectives),
                status,
                completedAt: allCompleted ? new Date() : null,
            },
        });

        // Si quête complétée, donner récompenses
        if (allCompleted) {
            await this.giveQuestRewards(sessionId, quest);
        }

        return updatedQuest;
    }

    private async giveQuestRewards(sessionId: string, quest: any) {
        const session = await this.prisma.gameSession.findUnique({
            where: { id: sessionId },
            include: { character: true },
        });

        if (!session) {
            throw new NotFoundException('Game session not found');
        }

        // Donner l'or
        await this.prisma.gameSession.update({
            where: { id: sessionId },
            data: { gold: session.gold + quest.goldReward },
        });

        // Donner l'XP
        await this.prisma.character.update({
            where: { id: session.characterId },
            data: { experience: session.character.experience + quest.xpReward },
        });

        // Mémoire narrative
        await this.embeddingsService.storeMemory({
            sessionId: session.conversationId,
            type: 'NARRATIVE',
            content: `Quête complétée : ${quest.name}. Récompenses : ${quest.goldReward} or, ${quest.xpReward} XP`,
            metadata: { questId: quest.questId },
        });
    }

    // ========== GESTION DE L'INVENTAIRE ==========

    async addItemToInventory(sessionId: string, itemData: {
        itemId: string;
        name: string;
        type: ItemType;
        quantity: number;
        properties: any;
    }) {
        // Vérifier si l'item existe déjà (pour stackables)
        const existingItem = await this.prisma.inventoryItem.findFirst({
            where: {
                sessionId,
                itemId: itemData.itemId,
                equippedAt: null,
            },
        });

        if (existingItem && itemData.type === ItemType.CONSUMABLE) {
            // Stack l'item existant
            return this.prisma.inventoryItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + itemData.quantity },
            });
        } else {
            // Créer un nouvel item
            return this.prisma.inventoryItem.create({
                data: {
                    sessionId,
                    itemId: itemData.itemId,
                    name: itemData.name,
                    type: itemData.type,
                    quantity: itemData.quantity,
                    properties: JSON.stringify(itemData.properties),
                },
            });
        }
    }

    async removeItemFromInventory(sessionId: string, itemId: string, quantity: number = 1) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { sessionId, itemId },
        });

        if (!item) {
            throw new NotFoundException('Item not found');
        }

        if (item.quantity <= quantity) {
            // Supprimer complètement
            await this.prisma.inventoryItem.delete({ where: { id: item.id } });
        } else {
            // Décrémenter
            await this.prisma.inventoryItem.update({
                where: { id: item.id },
                data: { quantity: item.quantity - quantity },
            });
        }
    }

    // ========== GESTION DU COMBAT ==========

    async startCombat(sessionId: string, enemies: CombatEnemy[]) {
        const session = await this.prisma.gameSession.findUnique({
            where: { id: sessionId },
            include: { character: true },
        });

        if (!session) {
            throw new NotFoundException('Game session not found');
        }

        const combat = await this.prisma.combat.create({
            data: {
                sessionId,
                isActive: true,
                currentTurn: 1,
                playerHP: session.character.health,
                playerMaxHP: session.character.maxHealth,
                playerMana: session.character.mana,
                playerMaxMana: session.character.maxMana,
                enemies: JSON.stringify(enemies),
                combatLog: JSON.stringify([]),
            },
        });

        // Mémoire narrative
        await this.embeddingsService.storeMemory({
            sessionId: session.conversationId,
            type: 'NARRATIVE',
            content: `Combat commencé contre : ${enemies.map(e => e.name).join(', ')}`,
        });

        return combat;
    }

    async endCombat(sessionId: string, victory: boolean) {
        const combat = await this.prisma.combat.findUnique({
            where: { sessionId },
        });

        if (!combat) {
            throw new NotFoundException('No active combat');
        }

        // Mettre à jour les PV du personnage
        const session = await this.prisma.gameSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException('Game session not found');
        }

        await this.prisma.character.update({
            where: { id: session.characterId },
            data: { health: combat.playerHP },
        });

        // Supprimer le combat
        await this.prisma.combat.delete({
            where: { id: combat.id },
        });

        // Mémoire narrative
        await this.embeddingsService.storeMemory({
            sessionId: session.conversationId,
            type: 'NARRATIVE',
            content: victory ? 'Combat remporté avec succès' : 'Défaite au combat',
        });

        return { victory };
    }
}
