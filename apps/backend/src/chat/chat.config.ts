export const AI_MODELS = {
    NARRATION: 'mistralai/mistral-small-creative',  // RP, storytelling
    PARSING: 'openai/gpt-4o',                        // Extraction de données
    FAST_PARSING: 'google/gemini-2.0-flash-exp:free', // Parsing simple/rapide
} as const;
