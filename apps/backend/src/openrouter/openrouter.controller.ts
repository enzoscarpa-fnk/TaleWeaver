import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';
import { ChatCompletionDto } from './dto/chat-completion.dto';

@Controller('api/chat')
export class OpenRouterController {
    constructor(private readonly openRouterService: OpenRouterService) {}

    @Post('completion')
    @UsePipes(new ValidationPipe({ transform: true }))
    async chatCompletion(@Body() body: ChatCompletionDto) {
        return this.openRouterService.chatCompletion({
            messages: body.messages,
            model: body.model,
        });
    }
}