
import React from 'react';
import { ICONS } from '../constants';

interface AnalyzeScreenButtonProps {
    onClick: () => void;
    isAnalyzing: boolean;
}

const AnalyzeScreenButton: React.FC<AnalyzeScreenButtonProps> = ({ onClick, isAnalyzing }) => {
    return (
        <button
            onClick={onClick}
            disabled={isAnalyzing}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 border ${isAnalyzing
                ? 'bg-purple-900/20 border-purple-500/30 text-purple-300 cursor-wait animate-pulse'
                : 'bg-purple-600/10 border-purple-500/20 text-purple-400 hover:bg-purple-600 hover:text-white shadow-lg shadow-purple-900/20'
                }`}
            title="Analyze Screen (Ctrl+Shift+A)"
        >
            {isAnalyzing ? (
                <>
                    <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span>ANALYZING...</span>
                </>
            ) : (
                <>
                    <ICONS.Zap />
                    <span>ANALYZE SCREEN</span>
                </>
            )}
        </button>
    );
};

export default AnalyzeScreenButton;
