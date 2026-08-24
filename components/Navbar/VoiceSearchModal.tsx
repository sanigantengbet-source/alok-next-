'use client';

import React, { useState, useEffect } from 'react';
import { Mic, X, Volume2, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const VoiceSearchModal: React.FC = () => {
  const { isVoiceModalOpen, setIsVoiceModalOpen, setSearchQuery, setCurrentView } = useApp();
  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [samplePhrases] = useState([
    'Next.js 15 Tutorial',
    'React full course',
    'Python for beginners',
    'CS50 Harvard AI',
    'Docker DevOps guide',
  ]);

  useEffect(() => {
    if (!isVoiceModalOpen) return;

    // Pick a random sample after 1.8s
    const timer = setTimeout(() => {
      const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
      setTranscript(randomPhrase);
    }, 1800);

    return () => {
      clearTimeout(timer);
    };
  }, [isVoiceModalOpen, samplePhrases]);

  if (!isVoiceModalOpen) return null;

  const handleSelectQuery = (query: string) => {
    setSearchQuery(query);
    setCurrentView('home');
    setIsVoiceModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#212121] rounded-2xl shadow-2xl p-6 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#383838]">
        {/* Close Button */}
        <button
          id="close-voice-modal-btn"
          onClick={() => setIsVoiceModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#383838] transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-semibold mb-2">Search with your voice</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {isListening ? (transcript ? 'Did you say:' : 'Listening... Speak now') : 'Microphone paused'}
        </p>

        {/* Pulse Mic Circle */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <span className="absolute w-24 h-24 rounded-full bg-red-500/20 animate-ping" />
                <span className="absolute w-20 h-20 rounded-full bg-red-500/30 animate-pulse" />
              </>
            )}
            <button
              id="voice-toggle-mic-btn"
              onClick={() => setIsListening(!isListening)}
              className="relative z-10 w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              <Mic className="w-8 h-8" />
            </button>
          </div>

          {transcript && (
            <div className="mt-6 p-3 bg-gray-100 dark:bg-[#2d2d2d] rounded-xl text-center w-full">
              <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                &ldquo;{transcript}&rdquo;
              </p>
              <button
                id="voice-confirm-search-btn"
                onClick={() => handleSelectQuery(transcript)}
                className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full transition-colors"
              >
                Search this query
              </button>
            </div>
          )}
        </div>

        {/* Quick Sample suggestions */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#383838]">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            Or try saying:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {samplePhrases.map((phrase) => (
              <button
                key={phrase}
                id={`voice-sample-${phrase.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => handleSelectQuery(phrase)}
                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#303030] dark:hover:bg-[#3e3e3e] rounded-full transition-colors text-gray-700 dark:text-gray-300"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
