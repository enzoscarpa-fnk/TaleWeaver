import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatCompletionRequest {
    messages: Message[];
    model?: string;
    sessionId?: string;
}

interface UsageData {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    total_cost?: number;
}

@Injectable()
export class OpenRouterService {
    private readonly apiKey: string;
    private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    private readonly defaultModel = 'openai/gpt-4o-mini';

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        const key = this.configService.get<string>('OPENROUTER_API_KEY');
        if (!key) {
            throw new Error('OPENROUTER_API_KEY is not defined');
        }
        this.apiKey = key;
    }

    async chatCompletion(request: ChatCompletionRequest): Promise<any> {
        try {
            const model = request.model || this.defaultModel;

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': this.configService.get<string>('APP_URL') || 'http://localhost:3000',
                    'X-Title': 'TaleWeaver RPG',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: request.messages,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new HttpException(
                    errorData || 'OpenRouter API error',
                    response.status
                );
            }

            const data = await response.json();

            // Sauvegarder l'usage dans la DB
            if (data.usage && request.sessionId) {
                await this.saveUsage(data, model, request.sessionId);
            }

            return data;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Unexpected error',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private async saveUsage(
        apiResponse: any,
        model: string,
        sessionId: string,
    ): Promise<void> {
        const usage = apiResponse.usage;
        const message = apiResponse.choices[0]?.message;

        if (!message || !usage) return;

        // Calculer les coûts
        const totalCost = usage.total_cost || this.calculateCost(model, usage);

        // Créer ou récupérer la session
        await this.prisma.chatSession.upsert({
            where: { id: sessionId },
            update: {},
            create: { id: sessionId },
        });

        // Sauvegarder le message
        await this.prisma.message.create({
        data: {
            sessionId,
            role: message.role,
            content: message.content,
            model,
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || 0,
            totalCost,
            promptCost: 0,
            completionCost: 0,
        },
    });

        // Mettre à jour les stats quotidiennes
        await this.updateDailyStats(model, usage, totalCost);
    }

    private calculateCost(model: string, usage: UsageData): number {
        // Tarifs approximatifs (à mettre à jour selon OpenRouter)
        const pricing: Record<string, { prompt: number; completion: number }> = {
            'openai/gpt-4o-mini': {
                prompt: 0.00015 / 1000, // $0.15 per 1M tokens
                completion: 0.0006 / 1000, // $0.60 per 1M tokens
            },
            'openai/gpt-4o': {
                prompt: 0.0025 / 1000,
                completion: 0.010 / 1000,
            },
        };

        const modelPricing = pricing[model] || pricing['openai/gpt-4o-mini'];

        return (
            usage.prompt_tokens * modelPricing.prompt +
            usage.completion_tokens * modelPricing.completion
        );
    }

    private async updateDailyStats(
        model: string,
        usage: UsageData,
        totalCost: number,
    ): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await this.prisma.usageStats.upsert({
            where: {
                userId_date_model: {
                    userId: 'default',
                    date: today,
                    model,
                },
            },
            update: {
                totalRequests: { increment: 1 },
                totalTokens: { increment: usage.total_tokens },
                totalCost: { increment: totalCost },
            },
            create: {
                userId: 'default',
                date: today,
                model,
                totalRequests: 1,
                totalTokens: usage.total_tokens,
                totalCost,
            },
        });
    }

    // Méthodes pour le dashboard
    async getUsageStats(startDate: Date, endDate: Date) {
        return this.prisma.usageStats.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { date: 'desc' },
        });
    }

    async getTotalCost(startDate?: Date, endDate?: Date) {
        const where = startDate && endDate ? {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        } : {};

        const result = await this.prisma.message.aggregate({
            where,
            _sum: {
                totalCost: true,
                totalTokens: true,
            },
            _count: true,
        });

        return {
            totalCost: result._sum.totalCost || 0,
            totalTokens: result._sum.totalTokens || 0,
            totalRequests: result._count,
        };
    }

    async getCostByModel(startDate?: Date, endDate?: Date) {
        const where = startDate && endDate ? {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        } : {};

        return this.prisma.message.groupBy({
            by: ['model'],
            where,
            _sum: {
                totalCost: true,
                totalTokens: true,
            },
            _count: true,
        });
    }
}