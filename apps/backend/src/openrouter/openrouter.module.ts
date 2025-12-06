import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenRouterService } from './openrouter.service';
import { OpenRouterController } from './openrouter.controller';

@Module({
    imports: [ConfigModule],
    controllers: [OpenRouterController],
    providers: [OpenRouterService],
    exports: [OpenRouterService],
})
export class OpenRouterModule {}