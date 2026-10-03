import React, { useState } from 'react';
import { Utensils, Clock, Heart, Sparkles, Image, Tag, AlignLeft, Layers } from 'lucide-react';
import { RecipeRecord, RecipeCategory } from '../types';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<RecipeRecord, 'id' | 'userId' | 'createdAt'>, existingId?: string) => Promise<void>;
  initialRecord?: RecipeRecord | null;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialRecord?.name || '');
  const [category, setCategory] = useState<RecipeCategory>(initialRecord?.category || 'Mocktail');
  const [ingredients, setIngredients] = useState(initialRecord?.ingredients || '');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(initialRecord ? String(initialRecord.prepTimeMinutes) : '5');
  const [cookTimeMinutes, setCookTimeMinutes] = useState(initialRecord ? String(initialRecord.cookTimeMinutes) : '0');
  const [method, setMethod] = useState(initialRecord?.method || '');
  const [steps, setSteps] = useState(initialRecord?.steps || '');
  const [notes, setNotes] = useState(initialRecord?.notes || '');
  const [tags, setTags] = useState(initialRecord?.tags || '');
  const [isFavorite, setIsFavorite] = useState(initialRecord?.isFavorite || false);
  const [photoUrl, setPhotoUrl] = useState(initialRecord?.photoUrl || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: RecipeCategory[] = ['Cocktail', 'Mocktail', 'Coffee', 'Syrup', 'Food', 'Other'];

  const samplePhotoSuggestions = [
    { label: 'Craft Coffee', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80' },
    { label: 'Luxury Mocktail', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80' },
    { label: 'Cocktail', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop&q=80' },
    { label: 'Artisanal Dish', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Recipe name is required.');
      return;
    }

    const prep = parseInt(prepTimeMinutes, 10) || 0;
    const cook = parseInt(cookTimeMinutes, 10) || 0;
    const total = prep + cook;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          category,
          ingredients: ingredients.trim(),
          prepTimeMinutes: prep,
          cookTimeMinutes: cook,
          totalTimeMinutes: total,
          method: method.trim(),
          steps: steps.trim(),
          notes: notes.trim(),
          tags: tags.trim(),
          isFavorite,
          photoUrl: photoUrl.trim() || undefined,
        },
        initialRecord?.id
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#12141c] border border-[#d4af37]/30 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-[#f1f5f9] my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#242938]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Cinzel'] text-[#fdf8f0] tracking-wide">
                {initialRecord ? 'Edit Recipe' : 'Craft New Recipe'}
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Elevate your culinary rituals, barista craft & mixology
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#fdf8f0] p-1.5 rounded-xl hover:bg-[#1c2130] transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 my-5">
          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Recipe Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="E.g., Smoked Vanilla Espresso Tonic"
                className="w-full px-3.5 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-sm font-semibold text-white placeholder-[#475569] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as RecipeCategory)}
                className="w-full px-3 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-[#12141c]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Durations & Favorite */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-[#0b0d13] border border-[#232838]">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#94a3b8] mb-1">
                Prep (min)
              </label>
              <input
                type="number"
                min="0"
                value={prepTimeMinutes}
                onChange={e => setPrepTimeMinutes(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#171a25] border border-[#232838] rounded-lg text-xs font-mono text-white focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#94a3b8] mb-1">
                Cook (min)
              </label>
              <input
                type="number"
                min="0"
                value={cookTimeMinutes}
                onChange={e => setCookTimeMinutes(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#171a25] border border-[#232838] rounded-lg text-xs font-mono text-white focus:border-[#d4af37]"
              />
            </div>

            <div className="flex flex-col items-center justify-center">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#94a3b8] mb-1">
                Favorite
              </label>
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-xl transition ${
                  isFavorite
                    ? 'text-rose-400 bg-rose-500/20 border border-rose-500/40'
                    : 'text-[#64748b] bg-[#171a25] border border-[#232838]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5 flex items-center justify-between">
              <span>Photo URL or Preset</span>
              <span className="text-[10px] text-[#64748b]">Stored in Cloud</span>
            </label>
            <div className="relative">
              <Image className="w-4 h-4 absolute left-3 top-3 text-[#64748b]" />
              <input
                type="url"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-9 pr-3 py-2 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-[10px] text-[#64748b] self-center">Presets:</span>
              {samplePhotoSuggestions.map(s => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setPhotoUrl(s.url)}
                  className="px-2.5 py-1 text-[10px] rounded-lg bg-[#181d2a] border border-[#232838] text-[#cbd5e1] hover:border-[#d4af37]/60"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Ingredients & Quantities (One per line)
            </label>
            <textarea
              rows={4}
              value={ingredients}
              onChange={e => setIngredients(e.target.value)}
              placeholder="E.g.,&#10;Double shot espresso (60ml)&#10;Cold sparkling water (120ml)&#10;Agave syrup (10ml)&#10;Orange slice"
              className="w-full p-3 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm font-mono text-white placeholder-[#475569] focus:outline-none focus:border-[#d4af37] resize-none leading-relaxed"
            />
          </div>

          {/* Steps & Instructions */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Method & Preparation Steps
            </label>
            <textarea
              rows={4}
              value={steps}
              onChange={e => setSteps(e.target.value)}
              placeholder="1. Fill crystal tumbler with artisanal clear ice.&#10;2. Pour chilled tonic water slowly.&#10;3. Float freshly pulled espresso over bar spoon.&#10;4. Garnish with charred rosemary."
              className="w-full p-3 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#d4af37] resize-none leading-relaxed"
            />
          </div>

          {/* Notes & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Barista / Chef Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Pair with dark chocolate or afternoon focus session"
                className="w-full px-3 py-2 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs text-white placeholder-[#475569] focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="signature, afternoon, alcohol-free"
                className="w-full px-3 py-2 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs text-white placeholder-[#475569] focus:border-[#d4af37]"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#232838] text-xs font-semibold text-[#94a3b8] hover:text-white hover:bg-[#1b202e] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa771c] hover:opacity-90 text-[#0b0c10] font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-950/40 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialRecord ? 'Update Recipe' : 'Add Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
