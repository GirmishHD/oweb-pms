import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = 'h-10 w-10 text-cyan-400' }) => {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 32 32" 
            fill="none" 
            className={className}
        >
            <defs>
                <linearGradient id="owebWaterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="waterGleam" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                </linearGradient>
            </defs>
            {/* Hydro Water Drop Shell */}
            <path 
                d="M16 2.5C16 2.5 6 13.8 6 20.5C6 26.0 10.5 30 16 30C21.5 30 26 26.0 26 20.5C26 13.8 16 2.5 16 2.5Z" 
                fill="url(#owebWaterGrad)" 
            />
            {/* Hydro Gleam Highlight */}
            <path 
                d="M16 5.5C16 5.5 9 14.5 9 19.8C9 21.8 10 23.5 11.5 24.8C10.5 23.5 9.8 21.8 9.8 19.8C9.8 15.2 16 6.8 16 5.5Z" 
                fill="url(#waterGleam)" 
            />
            {/* Gentle Water Ripple Line */}
            <path 
                d="M11.5 21C13.2 22.8 15.5 22.2 17.5 20.5C19.5 18.8 21.8 19.5 23.5 21.5" 
                stroke="#e0f2fe" 
                strokeWidth="1.6" 
                strokeLinecap="round" 
                strokeOpacity="0.8"
            />
        </svg>
    );
};
