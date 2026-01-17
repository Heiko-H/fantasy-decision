import React from 'react';

const DndRacePage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <h2 className="text-4xl md:text-6xl font-serif font-black mb-6 text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 uppercase tracking-widest">
                D&D Rasse und Klasse
            </h2>
            <p className="text-xl md:text-2xl font-sans text-gray-400 animate-pulse">
                Demnächst verfügbar...
            </p>
        </div>
    );
};

export default DndRacePage;
