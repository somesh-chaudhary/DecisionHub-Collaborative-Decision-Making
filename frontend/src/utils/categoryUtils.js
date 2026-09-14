import { useState, useEffect } from 'react';

export const DEFAULT_CATEGORIES = [
  'Technology',
  'Finance',
  'Career',
  'Travel',
  'Lifestyle',
  'Education',
  'General'
];

export const getCategories = () => {
  try {
    const saved = localStorage.getItem('decisionhub_admin_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse stored categories:", e);
  }
  return DEFAULT_CATEGORIES;
};

export const saveCategories = (newCategories) => {
  try {
    localStorage.setItem('decisionhub_admin_categories', JSON.stringify(newCategories));
    window.dispatchEvent(new Event('decisionhub_categories_updated'));
  } catch (e) {
    console.error("Failed to save categories:", e);
  }
};

export const useDynamicCategories = () => {
  const [categories, setCategories] = useState(getCategories);

  useEffect(() => {
    const handleCategoryUpdate = () => {
      setCategories(getCategories());
    };

    window.addEventListener('decisionhub_categories_updated', handleCategoryUpdate);
    window.addEventListener('storage', handleCategoryUpdate);

    return () => {
      window.removeEventListener('decisionhub_categories_updated', handleCategoryUpdate);
      window.removeEventListener('storage', handleCategoryUpdate);
    };
  }, []);

  return categories;
};
