import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import Icon, { ICONS } from './Icon';

type Theme = 'light' | 'dark' | 'auto';

const ThemeSwitcher = () => {
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();
    const options: { value: Theme; label: string; icon: string; }[] = [
        { value: 'light', label: t('themeLight'), icon: ICONS.SUN },
        { value: 'dark', label: t('themeDark'), icon: ICONS.MOON },
        { value: 'auto', label: t('themeSystem'), icon: ICONS.DESKTOP },
    ];

    return (
        <div className="theme-switcher">
            {options.map(option => (
                <button
                    key={option.value}
                    className={`theme-btn ${theme === option.value ? 'active' : ''}`}
                    onClick={() => setTheme(option.value)}
                    aria-label={t('switchToTheme', { theme: option.label })}
                >
                    <Icon path={option.icon} />
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ThemeSwitcher;