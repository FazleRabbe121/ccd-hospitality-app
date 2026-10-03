import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Heart,
  Clock,
  Trash2,
  Edit2,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { RecipeRecord, RecipeCategory } from '../types';

interface RecipeLibraryViewProps {
  recipes: RecipeRecord[];
  onOpenAddModal: () => void;
  onEditRecipe: (recipe: RecipeRecord) => void;
  onDeleteRecipe: (id: string) => Promise<void>;
  onToggleFavorite: (recipe: RecipeRecord) => Promise<void>;
}

export const RecipeLibraryView: React.FC<RecipeLibraryViewProps> = ({
  recipes,
  onOpenAddModal,
  onEditRecipe,
  onDeleteRecipe,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingRecipe, setViewingRecipe] = useState<RecipeRecord | null>(null);

  const categories: RecipeCategory[] = ['Cocktail', 'Mocktail', 'Coffee', 'Syrup', 'Food', 'Other'];

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchFav = !onlyFavorites || r.isFavorite;
      const matchSearch =
        searchQuery === '' ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.tags && r.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.ingredients.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchFav && matchSearch;
    });
  }, [recipes, selectedCategory, onlyFavorites, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2434]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd700] px-2.5 py-0.5 rounded-full bg-[#ffd700]/10 border border-[#d4af37]/30">
              Artisanal Vault
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-[#fdf8f0] tracking-wide mt-1">
            Recipe Library
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Cocktails, mocktails, pour-overs, tonics, and mindful dining
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] text-[#0b0c10] font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-950/40 hover:opacity-95 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Recipe</span>
        </button>
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-[#d4af37] text-[#0b0c10]'
                : 'bg-[#12151e] border border-[#232838] text-[#8c96ab] hover:text-white'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#d4af37] text-[#0b0c10]'
                  : 'bg-[#12151e] border border-[#232838] text-[#8c96ab] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Favorites Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              onlyFavorites
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-[#12151e] border-[#232838] text-[#8c96ab] hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
            <span>Favorites</span>
          </button>
        </div>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecipes.map(recipe => (
          <div
            key={recipe.id}
            className="group rounded-3xl bg-[#12151e] border border-[#202534] hover:border-[#d4af37]/50 overflow-hidden shadow-lg hover:shadow-[0_4px_24px_rgba(212,175,55,0.12)] transition-all duration-300 flex flex-col justify-between"
          >
            {/* Image Banner */}
            <div className="relative h-44 w-full bg-[#0b0d13] overflow-hidden">
              {recipe.photoUrl ? (
                <img
                  src={recipe.photoUrl}
                  alt={recipe.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#171a25] to-[#0d0f14] text-[#475569]">
                  <UtensilsCrossed className="w-10 h-10 opacity-30" />
                </div>
              )}

              {/* Category Badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[10px] uppercase font-bold tracking-wider text-white">
                {recipe.category}
              </div>

              {/* Favorite Button */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  onToggleFavorite(recipe);
                }}
                className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md border transition ${
                  recipe.isFavorite
                    ? 'bg-rose-950/80 border-rose-500/60 text-rose-400'
                    : 'bg-black/60 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold font-['Cinzel'] text-[#fdf8f0] group-hover:text-[#ffd700] transition line-clamp-1">
                  {recipe.name}
                </h3>

                <div className="flex items-center gap-3 text-xs text-[#8c96ab] my-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#ffd700]" />
                    {recipe.totalTimeMinutes} min total
                  </span>
                  <span>•</span>
                  <span>{recipe.category}</span>
                </div>

                <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed mb-3">
                  {recipe.notes || recipe.steps || 'View complete recipe method, ingredients checklist and timing.'}
                </p>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-[#1f2434] flex items-center justify-between">
                <button
                  onClick={() => setViewingRecipe(recipe)}
                  className="inline-flex items-center gap-1 text-xs text-[#ffd700] font-semibold hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Recipe</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditRecipe(recipe)}
                    className="p-1.5 text-[#8c96ab] hover:text-[#ffd700] rounded-lg hover:bg-[#1b202e] transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteRecipe(recipe.id)}
                    className="p-1.5 text-[#8c96ab] hover:text-rose-400 rounded-lg hover:bg-[#1b202e] transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredRecipes.length === 0 && (
          <div className="col-span-full text-center py-16 rounded-3xl bg-[#12151e] border border-[#202534]">
            <UtensilsCrossed className="w-12 h-12 text-[#64748b] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-white">No Recipes Found</h3>
            <p className="text-xs text-[#8c96ab] max-w-sm mx-auto mt-1 mb-4">
              Tap "New Recipe" to create your signature espresso tonic, evening mocktail, or restorative meal.
            </p>
            <button
              onClick={onOpenAddModal}
              className="px-5 py-2 rounded-xl bg-[#d4af37] text-[#0b0c10] text-xs font-bold uppercase tracking-wider shadow"
            >
              Add Your First Recipe
            </button>
          </div>
        )}
      </div>

      {/* Recipe Full Detail Viewer Modal */}
      {viewingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#12141c] border border-[#d4af37]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#f1f5f9] my-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#242938]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd700] px-2.5 py-0.5 rounded-full bg-[#ffd700]/10 border border-[#d4af37]/30">
                  {viewingRecipe.category}
                </span>
                <h2 className="text-2xl font-bold font-['Cinzel'] text-[#fdf8f0] mt-2">
                  {viewingRecipe.name}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[#8c96ab] mt-1">
                  <span>Prep: {viewingRecipe.prepTimeMinutes}m</span>
                  <span>•</span>
                  <span>Cook: {viewingRecipe.cookTimeMinutes}m</span>
                  <span>•</span>
                  <span className="text-[#ffd700] font-semibold">Total: {viewingRecipe.totalTimeMinutes}m</span>
                </div>
              </div>
              <button
                onClick={() => setViewingRecipe(null)}
                className="text-[#94a3b8] hover:text-[#fdf8f0] p-1.5 rounded-xl hover:bg-[#1c2130] transition"
              >
                ✕
              </button>
            </div>

            {/* Photo if exists */}
            {viewingRecipe.photoUrl && (
              <div className="my-4 h-60 w-full rounded-2xl overflow-hidden border border-[#232838]">
                <img
                  src={viewingRecipe.photoUrl}
                  alt={viewingRecipe.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Ingredients Checklist */}
            <div className="my-5 p-4 rounded-2xl bg-[#0b0d13] border border-[#232838]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ffd700] mb-2">
                Ingredients & Quantities
              </h3>
              <div className="text-xs sm:text-sm text-[#cbd5e1] font-mono whitespace-pre-line leading-relaxed">
                {viewingRecipe.ingredients || 'No ingredients listed.'}
              </div>
            </div>

            {/* Preparation Steps */}
            <div className="my-5 p-4 rounded-2xl bg-[#0b0d13] border border-[#232838]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ffd700] mb-2">
                Method & Execution
              </h3>
              <div className="text-xs sm:text-sm text-[#cbd5e1] whitespace-pre-line leading-relaxed">
                {viewingRecipe.steps || viewingRecipe.method || 'No preparation steps provided.'}
              </div>
            </div>

            {/* Notes & Tags */}
            {viewingRecipe.notes && (
              <div className="my-3 text-xs text-[#94a3b8] italic">
                Notes: "{viewingRecipe.notes}"
              </div>
            )}

            <div className="pt-4 flex items-center justify-end">
              <button
                onClick={() => setViewingRecipe(null)}
                className="px-6 py-2.5 rounded-xl bg-[#1b202e] hover:bg-[#252c3f] text-xs font-semibold text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
