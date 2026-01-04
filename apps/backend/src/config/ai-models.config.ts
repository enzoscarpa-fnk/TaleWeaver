export const AI_MODELS = {
    // Narration RP et storytelling
    NARRATION: 'mistralai/mistral-small-creative',

    // Extraction de données structurées (précision max)
    PARSING: 'openai/gpt-4o',

    // Parsing rapide pour données simples (économique)
    FAST_PARSING: 'google/gemini-2.0-flash-exp:free',

    // Embeddings pour la narration
    EMBEDDINGS: 'openai/text-embedding-3-small',
} as const;

export const AI_TEMPERATURES = {
    CREATIVE: 0.7,    // Pour narration
    BALANCED: 0.5,    // Pour dialogue
    PRECISE: 0.1,     // Pour extraction JSON
} as const;

export const EMBEDDINGS_DIMENSIONS = {
    SMALL: 1536,    // Pour narration
} as const;