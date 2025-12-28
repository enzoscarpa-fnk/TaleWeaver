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

            console.log('🔍 useCharacter: fetched all characters:', data.length);
            console.log('🔍 useCharacter: character names:', data.map(c => c.name));

            if (!characterId && data.length > 0) {
                const latest = data[data.length - 1];
                console.log('🔍 useCharacter: auto-selecting latest:', latest.name, latest.id);
                setCharacter(latest);
            }
        } catch (err) {
            setError(err as Error);
            console.error('❌ useCharacter: error fetching all:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCharacter = async (id: string) => {
        try {
            setLoading(true);
            console.log('🔍 useCharacter: fetching character by id:', id);
            const data = await characterService.getOne(id);
            console.log('🔍 useCharacter: fetched character:', data.name, data.id);
            setCharacter(data);
        } catch (err) {
            setError(err as Error);
            console.error('❌ useCharacter: error fetching one:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('🔍 useCharacter: useEffect triggered with characterId:', characterId);

        if (characterId) {
            fetchCharacter(characterId);
        } else {
            fetchCharacters();
        }

        // Fonction de cleanup pour éviter les fuites mémoire
        return () => {
            console.log('🔍 useCharacter: cleanup');
        };
    }, [characterId]);

    return {
        character,
        characters,
        loading,
        error,
        refetch: characterId ? () => fetchCharacter(characterId) : fetchCharacters,
    };
};
