import { Controller, Post, Get, Body, Query, ParseDatePipe, UseGuards } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';
import { ChatCompletionDto } from './dto/chat-completion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('api/chat')
export class OpenRouterController {
    constructor(private readonly openRouterService: OpenRouterService) {}

    @Post('completion')
    async chatCompletion(@Body() body: ChatCompletionDto) {
        return this.openRouterService.chatCompletion({
            messages: body.messages,
            model: body.model,
            sessionId: body.sessionId,
        });
    }

    @Get('stats/total')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getTotalCost(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        return this.openRouterService.getTotalCost(start, end);
    }

    @Get('stats/by-model')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getCostByModel(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        return this.openRouterService.getCostByModel(start, end);
    }

    @Get('stats/daily')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getDailyStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        return this.openRouterService.getUsageStats(start, end);
    }
}