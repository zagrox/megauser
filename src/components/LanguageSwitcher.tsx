import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const options = [
        { value: 'en', label: 'English' },
        { value: 'fa', label: 'فارسی' },
    ];

    return (
        <div className="language-switcher">
            {options.map(option => (
                <button
                    key={option.value}
                    className={`language-btn ${i18n.language === option.value ? 'active' : ''}`}
                    onClick={() => i18n.changeLanguage(option.value)}
                >
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
