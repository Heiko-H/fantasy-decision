import React from 'react';

const Header: React.FC = () => {
    return (
        <header
            className="w-full py-4 px-6 border-b border-gray-800/50 backdrop-blur-md bg-black/30 flex flex-row items-center justify-center gap-4">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="h-10 w-auto md:h-12"/>
            <h1 className="text-xl md:text-3xl font-serif font-black tracking-[0.1em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] [text-shadow:_1px_1px_0_rgb(0_0_0_/_40%)]">
                Fantasy Game
            </h1>
        </header>
    );
};

export default Header;
