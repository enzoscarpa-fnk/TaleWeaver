import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AI_MODELS } from '../config/ai-models.config';

const OPENROUTER_CONFIG = {
    baseUrl: 'https://openrouter.ai/api/v1',
    headers: {
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'TaleWeaver RPG',
    },
};

export interface CreateMemoryDto {
    sessionId: string;
    type: 'NARRATIVE' | 'NPC_INTERACTION' | 'PLAYER_ACTION';
    content: string;
    metadata?: Record<string, any>;
}

export interface MemorySearchResult {
    id: string;
    sessionId: string;
    type: string;
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
    similarity: number;
}

@Injectable()
export class EmbeddingsService implements OnModuleDestroy {
    private readonly apiKey: string;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {
        const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
        if (!apiKey) {
            throw new Error(
                '❌ OPENROUTER_API_KEY is missing in .env file. ' +
                'Please add it: OPENROUTER_API_KEY=your_key_here'
            );
        }
        this.apiKey = apiKey;
        console.log('✅ EmbeddingsService initialized (in-memory search mode)');
    }

    onModuleDestroy() {
        // Nothing to clean up
    }

    /**
     * Calcul de similarité cosinus
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/embeddings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                ...OPENROUTER_CONFIG.headers,
            },
            body: JSON.stringify({
                model: AI_MODELS.EMBEDDINGS,
                input: text,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenRouter embeddings error: ${error}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    }

    async storeMemory(memory: CreateMemoryDto): Promise<string> {
        const embedding = await this.generateEmbedding(memory.content);

        const savedMemory = await this.prisma.memory.create({
            data: {
                sessionId: memory.sessionId,
                type: memory.type,
                content: memory.content,
                embedding: JSON.stringify(embedding),
                metadata: memory.metadata ? JSON.stringify(memory.metadata) : null,
            },
        });

        console.log(`✅ Memory stored: ${savedMemory.id} (${memory.type})`);
        return savedMemory.id;
    }

    /**
     * Recherche avec similarité cosinus calculée en JavaScript
     * (Moins performant que sqlite-vec mais fonctionne sans bindings natifs)
     */
    async searchMemories(
        sessionId: string,
        query: string,
        topK: number = 5,
    ): Promise<MemorySearchResult[]> {
        const queryEmbedding = await this.generateEmbedding(query);

        // Récupérer toutes les mémoires de la session
        const allMemories = await this.prisma.memory.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'desc' },
        });

        if (allMemories.length === 0) {
            return [];
        }

        // Calculer les similarités en mémoire
        const memoriesWithSimilarity = allMemories.map((m) => {
            const embedding = JSON.parse(m.embedding);
            const similarity = this.cosineSimilarity(queryEmbedding, embedding);

            return {
                id: m.id,
                sessionId: m.sessionId,
                type: m.type,
                content: m.content,
                timestamp: m.timestamp,
                metadata: m.metadata ? JSON.parse(m.metadata) : undefined,
                similarity,
            };
        });

        // Trier par similarité décroissante et prendre le top K
        return memoriesWithSimilarity
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }

    async getRecentMemories(
        sessionId: string,
        limit: number = 10,
    ): Promise<MemorySearchResult[]> {
        const memories = await this.prisma.memory.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });

        return memories.map((m) => ({
            id: m.id,
            sessionId: m.sessionId,
            type: m.type,
            content: m.content,
            timestamp: m.timestamp,
            metadata: m.metadata ? JSON.parse(m.metadata) : undefined,
            similarity: 1,
        }));
    }

    async clearSessionMemories(sessionId: string): Promise<number> {
        const result = await this.prisma.memory.deleteMany({
            where: { sessionId },
        });

        console.log(`🗑️  Cleared ${result.count} memories for session ${sessionId}`);
        return result.count;
    }
}
