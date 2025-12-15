import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const characterCreationService = {
    async processStep(data: {
                           sessionId: string;
                           currentStep: string;
                           userMessage: string;
                           accumulatedData: any;
                       }) {
        const { data: response } = await axios.post(
            `${API_URL}/characters/creation/step`,
            data
        );
        return response;
    },

    async finalize(characterData: any) {
        const { data } = await axios.post(
            `${API_URL}/characters/creation/finalize`,
            characterData
        );
        return data;
    },
};
