import {useEffect, useState} from 'react';
import type {GameState} from '../types/game';

const STORAGE_KEY = 'chatgame_state';

const initialState: GameState = {
    currentQuestionId: 'start',
    history: [],
    isFinished: false,
    finalEpilogueId: null,
};

export function useGameState() {
    const [state, setState] = useState<GameState>(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : initialState;
    });

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const updateState = (newState: Partial<GameState>) => {
        setState(prev => ({...prev, ...newState}));
    };

    const resetGame = () => {
        setState(initialState);
    };

    return {state, updateState, resetGame};
}
