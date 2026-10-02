import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { THEMES } from '../utils/theme.js';

export const NameModal = ({ user, isOpen, onClose, onSaveName }) => {
  const [name, setName] = useState(user.name || '');

  if (!isOpen) return null;

  const theme = THEMES[user.theme] || THEMES.oatmeal;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveName(name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        className={`w-full max-w-sm rounded-2xl border ${theme.border} ${theme.surface} p-6 shadow-xl relative animate-fadeIn`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-stone-400 hover:text-stone-700 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <div className="w-8 h-8 rounded-full bg-stone-200/60 dark:bg-stone-800 flex items-center justify-center mb-3">
            <User className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          </div>
          <h3 className={`text-xl font-serif-writing font-medium ${theme.text}`}>
            What should we call you?
          </h3>
          <p className={`text-xs font-sans mt-1 ${theme.textMuted}`}>
            Your name is used for the peaceful daily greetings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Harshit"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${theme.border} bg-white/70 dark:bg-stone-900/60 ${theme.text} outline-none focus:border-stone-500`}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 text-xs rounded-lg ${theme.textMuted} hover:${theme.text}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-xs font-medium rounded-lg ${theme.accent} ${theme.accentHover} transition-colors`}
            >
              Save Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
