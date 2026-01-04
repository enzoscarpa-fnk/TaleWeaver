import { Controller, Get, Param, Query } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';

@Controller('api/memories')
export class EmbeddingsController {
    constructor(private embeddingsService: EmbeddingsService) {}

    @Get(':sessionId/recent')
    async getRecentMemories(
        @Param('sessionId') sessionId: string,
        @Query('limit') limit?: string,
    ) {
        const maxResults = limit ? parseInt(limit) : 5;
        return this.embeddingsService.getRecentMemories(sessionId, maxResults);
    }
}