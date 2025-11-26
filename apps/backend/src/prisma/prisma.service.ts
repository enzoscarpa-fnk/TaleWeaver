import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(private configService: ConfigService) {
        const dbPath = configService.get<string>('DATABASE_URL')?.replace('file:', '') || 'dev.db';

        // Passer directement la config à l'adapter
        const adapter = new PrismaLibSql({
            url: `file:${dbPath}`,
        });

        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        console.log('✅ Database connected');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log('❌ Database disconnected');
    }
}