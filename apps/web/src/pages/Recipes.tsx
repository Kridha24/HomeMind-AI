import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Sparkles, Clock, Flame, Leaf, Award } from 'lucide-react';
import apiClient from '../services/apiClient';

export const Recipes: React.FC = () => {
  const [recipes, setRecipes] = useState<any[]>([]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const res = await apiClient.get('/ai/recipes');
      setRecipes(res.data.recipes);
    } catch (e) {
      setRecipes([
        {
          title: 'Creamy Spinach & Garlic Pasta',
          prepTimeMins: 20,
          calories: 420,
          category: 'Quick Meal',
          isVegetarian: true,
          ingredients: ['Fresh Spinach', 'Garlic', 'Pasta', 'Heavy Cream', 'Parmesan'],
          instructions: '1. Boil pasta in salted water until al dente.\n2. Sauté minced garlic and fresh spinach in olive oil.\n3. Stir in cream, parmesan, and combine with pasta.',
          reason: 'Uses fresh spinach expiring in 2 days (Zero Waste)'
        },
        {
          title: 'Mediterranean Chickpea & Tomato Bowl',
          prepTimeMins: 15,
          calories: 310,
          category: 'Healthy',
          isVegetarian: true,
          ingredients: ['Chickpeas', 'Tomatoes', 'Cucumber', 'Olive Oil', 'Feta Cheese'],
          instructions: '1. Chop tomatoes and cucumber into dice.\n2. Mix with rinsed chickpeas.\n3. Drizzle with extra virgin olive oil and lemon.',
          reason: 'High protein, budget friendly ($2.40/serving)'
        }
      ]);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          Zero-Food-Waste AI Recipes
          <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
        </h1>
        <p className="text-xs text-muted">Personalized recipes matched directly against your available grocery inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map((r, i) => (
          <div key={i} className="glass-panel p-6 space-y-4 border-primary hover:border-emerald-500/40 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {r.category}
                </span>
                <h3 className="font-bold text-base text-primary mt-2">{r.title}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Clock className="w-3.5 h-3.5" /> {r.prepTimeMins} mins
              </div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{r.reason}</span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-secondary mb-1.5">Required Ingredients:</h4>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(r.ingredients) ? r.ingredients : []).map((ing: any, idx: number) => (
                  <span key={idx} className="text-[10px] bg-secondary text-secondary px-2 py-1 rounded-md border border-secondary">
                    {typeof ing === 'string' ? ing : ing.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-secondary mb-1">Instructions:</h4>
              <p className="text-xs text-muted whitespace-pre-line leading-relaxed">{r.instructions}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
