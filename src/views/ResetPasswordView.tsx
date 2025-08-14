import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ActionStatus from '../components/ActionStatus';
import Loader from '../components/Loader';
import Icon, { ICONS } from '../components/Icon';

const ResetPasswordView = () => {
    const { resetPassword } = useAuth();
    const { t } = useTranslation();
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        const queryString = hash.split('?')[1] || '';
        const params = new URLSearchParams(queryString);
        const tokenFromUrl = params.get('token');

        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            setError(t('invalidResetToken'));
        }
    }, [t]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        if (!token) {
            setError(t('invalidResetToken'));
            return;
        }

        const form = e.currentTarget;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;
        const confirm_password = (form.elements.namedItem('confirm_password') as HTMLInputElement).value;

        if (password !== confirm_password) {
            setError(t('passwordsDoNotMatch'));
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setSuccess(true);
        } catch (err: any) {
            let errorMessage = err.message;
            if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
                errorMessage = err.errors[0].message;
            }
            setError(errorMessage || t('unknownError'));
        } finally {
            setLoading(false);
        }
    };
    
    const goToLogin = () => {
        window.location.href = '/';
    }

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-box">
                    <div style={{ marginBottom: '1rem' }}>
                        <Icon path={ICONS.CHECK} style={{ width: 48, height: 48, color: 'var(--success-color)' }} />
                    </div>
                    <h2>{t('passwordResetSuccessTitle')}</h2>
                    <p>{t('passwordResetSuccessMessage')}</p>
                    <button onClick={goToLogin} className="btn btn-primary full-width" style={{ marginTop: '1.5rem' }}>
                        {t('goToLogin')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h1><span className="logo-font">Mailzila</span></h1>
                <p>{t('resetPasswordSubtitle')}</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <ActionStatus status={{ type: 'error', message: error }} onDismiss={() => setError('')} />}

                    <fieldset disabled={!token || loading} style={{border: 'none', padding: 0, margin: 0, display: 'contents'}}>
                        <div className="input-group has-btn">
                            <span className="input-icon"><Icon path={ICONS.LOCK} /></span>
                            <input name="password" type={showPassword ? "text" : "password"} placeholder={t('newPassword')} required />
                             <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                            </button>
                        </div>
                        <div className="input-group">
                            <span className="input-icon"><Icon path={ICONS.LOCK} /></span>
                            <input name="confirm_password" type="password" placeholder={t('confirmPassword')} required />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading || !token}>
                            {loading ? <Loader /> : t('resetPassword')}
                        </button>
                    </fieldset>
                </form>
                 <div className="auth-switch">
                    <button onClick={goToLogin} className="link-button">{t('backToSignIn')}</button>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordView;