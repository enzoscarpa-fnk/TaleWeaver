import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmbeddingsService } from './embeddings.service';

async function testEmbeddings() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const embeddingsService = app.get(EmbeddingsService);

    console.log('🧪 Test du système d\'embeddings\n');

    const sessionId = 'test-session-001';

    // 1. Stocker des mémoires de test
    console.log('📝 Stockage de mémoires...');
    await embeddingsService.storeMemory({
        sessionId,
        type: 'PLAYER_ACTION',
        content: 'Le joueur a sauvé le village des bandits et est devenu un héros local',
        metadata: { location: 'Village de Bree', reputation: +50 },
    });

    await embeddingsService.storeMemory({
        sessionId,
        type: 'NPC_INTERACTION',
        content: 'Le forgeron a offert une épée gratuite au joueur en remerciement',
        metadata: { npcId: 'blacksmith-01' },
    });

    await embeddingsService.storeMemory({
        sessionId,
        type: 'NARRATIVE',
        content: 'Une tempête mystérieuse s\'abat sur la région, les villageois sont inquiets',
    });

    await embeddingsService.storeMemory({
        sessionId,
        type: 'PLAYER_ACTION',
        content: 'Le joueur a volé de la nourriture au marché et s\'est fait prendre',
        metadata: { location: 'Marché', reputation: -20 },
    });

    // 2. Tester les recherches
    console.log('\n🔍 Test de recherche sémantique...\n');

    const queries = [
        'Le joueur est-il respecté dans le village ?',
        'Y a-t-il des problèmes météorologiques ?',
        'Comment le forgeron perçoit-il le joueur ?',
    ];

    for (const query of queries) {
        console.log(`\n📍 Requête: "${query}"`);
        const results = await embeddingsService.searchMemories(sessionId, query, 3);

        console.log(`📊 Top ${results.length} résultats:`);
        results.forEach((r, i) => {
            console.log(`   ${i + 1}. [${r.similarity.toFixed(3)}] [${r.type}]`);
            console.log(`      ${r.content}`);
        });
    }

    // 3. Nettoyage
    console.log('\n🗑️  Nettoyage...');
    await embeddingsService.clearSessionMemories(sessionId);

    await app.close();
    console.log('\n✅ Tests terminés');
}

testEmbeddings().catch(console.error);
