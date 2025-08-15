

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/elasticEmail';
import { useToast } from '../contexts/ToastContext';
import Loader from '../components/Loader';
import Icon, { ICONS } from '../components/Icon';

const OnboardingView = () => {
    const { updateUser, user, logout } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useTranslation();
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiFetch('/account/load', apiKey); // Validate key
            await updateUser({ elastickey: apiKey });
        } catch (err: any) {
            const errorMessage = typeof err.message === 'string' ? err.message : JSON.stringify(err);
            addToast(errorMessage || t('invalidApiKey'), 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const displayName = user?.first_name || user?.email;

    return (
        <div className="auth-container">
            <div className="auth-box">
                 <h1>{displayName ? t('welcomeOnboard', {name: displayName}) : "Welcome!"}</h1>
                 <p>{t('onboardingSubtitle')}</p>
                 <form className="auth-form" onSubmit={handleSubmit} style={{gap: '1.5rem'}}>
                    <div className="input-group has-btn">
                        <span className="input-icon"><Icon path={ICONS.KEY} /></span>
                        <input name="apikey" type={showPassword ? "text" : "password"} placeholder={t('enterYourApiKey')} value={apiKey} onChange={e => setApiKey(e.target.value)} required />
                        <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle API key visibility">
                            <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                        </button>
                    </div>
                    <button type="submit" className="btn btn-primary full-width" disabled={loading || !apiKey}>
                        {loading ? <Loader /> : t('saveAndContinue')}
                    </button>
                 </form>
                 <div className="auth-switch" style={{marginTop: '1.5rem'}}>
                    <button className="link-button" onClick={logout}>{t('logOut')}</button>
                 </div>
            </div>
        </div>
    );
};

export default OnboardingView;
