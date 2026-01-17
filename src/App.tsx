import {useGameState} from './hooks/useGameState';
import {EPILOGUES, QUESTIONS} from './data/adventure';
import type {Answer} from './types/game';
import QuestionCard from './components/QuestionCard';
import EndScreen from './components/EndScreen';
import Header from "./components/Header.tsx";

function App() {
    const {state, updateState, resetGame} = useGameState();

    const handleAnswer = (answer: Answer) => {
        const newHistory = [...state.history, answer.id];

        // Check if nextQuestionId exists in EPILOGUES
        if (EPILOGUES[answer.nextQuestionId]) {
            updateState({
                history: newHistory,
                isFinished: true,
                finalEpilogueId: answer.nextQuestionId,
                currentQuestionId: null
            });
        } else if (QUESTIONS[answer.nextQuestionId]) {
            updateState({
                history: newHistory,
                currentQuestionId: answer.nextQuestionId
            });
        } else {
            console.error("Next ID not found in QUESTIONS or EPILOGUES:", answer.nextQuestionId);
        }
    };

    const currentQuestion = state.currentQuestionId ? QUESTIONS[state.currentQuestionId] : null;
    const currentEpilogue = state.finalEpilogueId ? EPILOGUES[state.finalEpilogueId] : null;

    return (
        <div
            className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black flex flex-col font-sans text-gray-200">
            <Header/>

            <main className="flex-grow flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-4xl animate-fadeIn">
                    {!state.isFinished && currentQuestion && (
                        <QuestionCard
                            question={currentQuestion}
                            onAnswer={handleAnswer}
                        />
                    )}

                    {state.isFinished && currentEpilogue && (
                        <EndScreen
                            epilogue={currentEpilogue}
                            onRestart={resetGame}
                        />
                    )}

                    {!state.isFinished && !currentQuestion && (
                        <div className="text-center">
                            <h1 className="text-3xl font-bold mb-4">Ein Fehler ist aufgetreten oder das Abenteuer ist zu
                                Ende.</h1>
                            <button onClick={resetGame}
                                    className="px-6 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">Neustart
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
