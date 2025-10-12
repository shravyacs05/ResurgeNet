import { useState, useEffect } from 'react';

const useSimpleTranslate = () => {
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState({});

  // Load translations
  useEffect(() => {
    fetch('/translations.json')
      .then(response => response.json())
      .then(data => setTranslations(data))
      .catch(error => console.error('Error loading translations:', error));
  }, []);

  // Get translation
  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  // Change language
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  // Initialize from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    setLanguage(savedLang);
  }, []);

  return { t, language, changeLanguage };
};

export default useSimpleTranslate;