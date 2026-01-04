import { Controller, Get, Post, Delete, Patch, Param, Body, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/conversations')
export class ConversationsController {
    constructor(
        private readonly conversationsService: ConversationsService,
        private readonly prisma: PrismaService,
    ) {}

    @Post()
    async create(@Body() body: { userId?: string; title?: string }) {
        return this.conversationsService.create(body.userId, body.title);
    }

    @Get()
    async findAll(@Query('userId') userId?: string) {
        return this.conversationsService.findAll(userId);
    }

    @Get(':id/context')
    async getConversationContext(@Param('id') id: string) {
        const characters = await this.prisma.character.findMany({
            orderBy: { createdAt: 'desc' },
            take: 1,
        });

        if (characters.length === 0) {
            return { type: 'welcome' };
        }

        const gameSession = await this.prisma.gameSession.findUnique({
            where: { conversationId: id },
        });

        if (gameSession) {
            return {
                type: 'game',
                characterId: gameSession.characterId,
            };
        }

        return { type: 'welcome' };
    }

    @Get(':id')
    async getConversation(@Param('id') id: string) {
        const conversation = await this.conversationsService.findOne(id);
        return conversation ?? null;
    }

    @Get(':id/messages')
    async getMessages(@Param('id') id: string, @Query('limit') limit?: string) {
        return this.conversationsService.getRecentMessages(
            id,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Patch(':id')
    async updateTitle(@Param('id') id: string, @Body() body: { title: string }) {
        return this.conversationsService.updateTitle(id, body.title);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.conversationsService.delete(id);
    }
}
