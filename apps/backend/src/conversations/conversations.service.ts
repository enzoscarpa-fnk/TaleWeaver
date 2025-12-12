import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(userId?: string, title?: string) {
        return this.prisma.conversation.create({
        data: { userId, title },
    });
    }

    async findOne(id: string) {
        return this.prisma.conversation.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
    }

    async findAll(userId?: string) {
        return this.prisma.conversation.findMany({
            where: userId ? { userId } : {},
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: { select: { messages: true } },
            },
        });
    }

    async updateTitle(id: string, title: string) {
        return this.prisma.conversation.update({
            where: { id },
            data: { title },
        });
    }

    async delete(id: string) {
        return this.prisma.conversation.delete({
            where: { id },
        });
    }

    async getRecentMessages(sessionId: string, limit = 20) {
        return this.prisma.message.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
