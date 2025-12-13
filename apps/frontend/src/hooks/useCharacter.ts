import { useState, useEffect } from 'react';
import { characterService, Character } from '../services/character.service';

export const useCharacter = (characterId?: string) => {
    const [character, setCharacter] = useState<Character | null>(null);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCharacters = async () => {
        try {
            setLoading(true);
            const data = await characterService.getAll();
            setCharacters(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCharacter = async (id: string) => {
        try {
            setLoading(true);
            const data = await characterService.getOne(id);
            setCharacter(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (characterId) {
            fetchCharacter(characterId);
        } else {
            fetchCharacters();
        }
    }, [characterId]);

    return {
        character,
        characters,
        loading,
        error,
        refetch: characterId ? () => fetchCharacter(characterId) : fetchCharacters,
    };
};
