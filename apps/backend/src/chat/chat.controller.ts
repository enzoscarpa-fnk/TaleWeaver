import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) {}

    @Post('message')
    async sendMessage(@Body() body: any) {
        const { sessionId, message, context } = body;

        return this.chatService.processMessage(
            sessionId,
            message,
            context || { type: 'idle' },
        );
    }
}