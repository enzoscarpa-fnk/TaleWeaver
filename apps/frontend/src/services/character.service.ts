import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface Character {
    id: string;
    name: string;
    class: string;
    level: number;
    experience: number;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    strength: number;
    intelligence: number;
    agility: number;
    backstory?: string;
    avatar?: string;
}

export const characterService = {
    async getAll(): Promise<Character[]> {
        const { data } = await axios.get(`${API_URL}/characters`);
        return data;
    },

    async getOne(id: string): Promise<Character> {
        const { data } = await axios.get(`${API_URL}/characters/${id}`);
        return data;
    },

    async create(character: Partial<Character>): Promise<Character> {
        const { data } = await axios.post(`${API_URL}/characters`, character);
        return data;
    },

    async update(id: string, updates: Partial<Character>): Promise<Character> {
        const { data } = await axios.patch(`${API_URL}/characters/${id}`, updates);
        return data;
    },

    async delete(id: string): Promise<void> {
        await axios.delete(`${API_URL}/characters/${id}`);
    },

    async levelUp(id: string): Promise<Character> {
        const { data } = await axios.post(`${API_URL}/characters/${id}/level-up`);
        return data;
    },
};
