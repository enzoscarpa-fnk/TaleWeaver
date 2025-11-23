import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatCompletionRequest {
    messages: Message[];
    model?: string;
}

@Injectable()
export class OpenRouterService {
    private readonly apiKey: string;
    private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    private readonly defaultModel = 'openai/gpt-4o-mini';

    constructor(private configService: ConfigService) {
        const key = this.configService.get<string>('OPENROUTER_API_KEY');
        if (!key) {
            throw new Error('OPENROUTER_API_KEY is not defined');
        }
        this.apiKey = key;
    }

    async chatCompletion(request: ChatCompletionRequest): Promise<any> {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': this.configService.get<string>('APP_URL') || 'http://localhost:3000',
                    'X-Title': 'TaleWeaver RPG',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: request.model || this.defaultModel,
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

            return await response.json();
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

    async streamChatCompletion(request: ChatCompletionRequest): Promise<ReadableStream> {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': this.configService.get<string>('APP_URL') || 'http://localhost:3000',
                    'X-Title': 'TaleWeaver RPG',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: request.model || this.defaultModel,
                    messages: request.messages,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new HttpException('Stream error', response.status);
            }

            if (!response.body) {
                throw new HttpException(
                    'Response body is null',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return response.body;
        } catch (error) {
            throw new HttpException(
                'Stream error',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}