import useSimpleTranslate from '../hooks/useSimpleTranslate';

const SimpleLanguageSwitcher = () => {
  const { language, changeLanguage } = useSimpleTranslate();

  return (
    <select 
      value={language} 
      onChange={(e) => changeLanguage(e.target.value)}
      className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
    >
      <option value="en">English</option>
      <option value="hi">हिन्दी</option>
      <option value="mr">मराठी</option>
    </select>
  );
};

export default SimpleLanguageSwitcher;