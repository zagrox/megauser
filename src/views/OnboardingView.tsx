import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/elasticEmail';
import ActionStatus from '../components/ActionStatus';
import Loader from '../components/Loader';

const OnboardingView = () => {
    const { updateUser, user, logout } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiFetch('/account/load', apiKey); // Validate key
            await updateUser({ elastic_email_api_key: apiKey });
        } catch (err: any) {
            setError(err.message || t('invalidApiKey'));
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-box">
                 <h1>{t('welcomeOnboard', {name: user.first_name})}</h1>
                 <p>{t('onboardingSubtitle')}</p>
                 <form onSubmit={handleSubmit}>
                    {error && <ActionStatus status={{ type: 'error', message: error }} onDismiss={() => setError('')} />}
                    <input name="apikey" type="password" placeholder={t('enterYourApiKey')} value={apiKey} onChange={e => setApiKey(e.target.value)} required />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <Loader /> : t('saveAndContinue')}
                    </button>
                 </form>
                 <div className="auth-switch">
                    <button className="link-button" onClick={logout}>{t('logOut')}</button>
                 </div>
            </div>
        </div>
    );
};

export default OnboardingView;