import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenRouterService } from './openrouter.service';
import { OpenRouterController } from './openrouter.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [ConfigModule, AuthModule],
    controllers: [OpenRouterController],
    providers: [OpenRouterService],
    exports: [OpenRouterService],
})
export class OpenRouterModule {}