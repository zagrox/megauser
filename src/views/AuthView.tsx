
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ActionStatus from '../components/ActionStatus';
import Loader from '../components/Loader';
import Icon, { ICONS } from '../components/Icon';

const AuthView = () => {
    const { login, loginWithApiKey, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isApiKeyLogin, setIsApiKeyLogin] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setRegistrationSuccess(false);
        const form = e.currentTarget;

        try {
            if (isApiKeyLogin) {
                const apikey = (form.elements.namedItem('apikey') as HTMLInputElement).value;
                await loginWithApiKey(apikey);
            } else if (isLogin) {
                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                const password = (form.elements.namedItem('password') as HTMLInputElement).value;
                await login({ email, password });
            } else {
                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                const password = (form.elements.namedItem('password') as HTMLInputElement).value;
                const confirm_password = (form.elements.namedItem('confirm_password') as HTMLInputElement).value;
                const first_name = (form.elements.namedItem('first_name') as HTMLInputElement).value;
                const last_name = (form.elements.namedItem('last_name') as HTMLInputElement).value;

                if (password !== confirm_password) {
                    throw new Error(t('passwordsDoNotMatch'));
                }
                await register({ email, password, first_name, last_name });
                setRegistrationSuccess(true);
            }
        } catch (err: any) {
            if (err.data) {
                const debugMessage = `DEBUG - Server Response:\n${JSON.stringify(err.data, null, 2)}`;
                setError(debugMessage);
            } else {
                let errorMessage = err.message;
                if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
                    errorMessage = err.errors[0].message;
                }
                setError(errorMessage || t('unknownError'));
            }
        } finally {
            setLoading(false);
        }
    };

    const switchToLogin = () => {
        setIsLogin(true);
        setError('');
        setRegistrationSuccess(false);
    };

    const switchToRegister = () => {
        setIsLogin(false);
        setError('');
        setRegistrationSuccess(false);
    };

    if (registrationSuccess) {
        return (
            <div className="auth-container">
                <div className="auth-box">
                    <div style={{ marginBottom: '1rem' }}>
                        <Icon path={ICONS.CHECK} style={{ width: 48, height: 48, color: 'var(--success-color)' }} />
                    </div>
                    <h2>{t('registrationSuccessTitle')}</h2>
                    <p>{t('registrationSuccessMessage')}</p>
                    <button onClick={switchToLogin} className="btn btn-primary full-width" style={{ marginTop: '1.5rem' }}>
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
                <p>
                    {isApiKeyLogin ? t('signInWithApiKeySubtitle') : (isLogin ? t('signInSubtitle') : t('createAccountSubtitle'))}
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <ActionStatus status={{ type: 'error', message: error }} onDismiss={() => setError('')} />}

                    {isApiKeyLogin ? (
                        <div className="input-group has-btn">
                            <span className="input-icon"><Icon path={ICONS.KEY} /></span>
                            <input name="apikey" type={showPassword ? "text" : "password"} placeholder={t('enterYourApiKey')} required />
                            <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                            </button>
                        </div>
                    ) : isLogin ? (
                         <>
                            <div className="input-group">
                                <span className="input-icon"><Icon path={ICONS.MAIL} /></span>
                                <input name="email" type="email" placeholder={t('emailAddress')} required />
                            </div>
                            <div className="input-group has-btn">
                                <span className="input-icon"><Icon path={ICONS.LOCK} /></span>
                                <input name="password" type={showPassword ? "text" : "password"} placeholder={t('password')} required />
                                <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                    <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                                </button>
                            </div>
                        </>
                    ) : (
                        // Registration Form
                        <>
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <span className="input-icon"><Icon path={ICONS.ACCOUNT} /></span>
                                    <input name="first_name" type="text" placeholder={t('firstName')} required />
                                </div>
                                <div className="input-group">
                                    <span className="input-icon"><Icon path={ICONS.ACCOUNT} /></span>
                                    <input name="last_name" type="text" placeholder={t('lastName')} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <span className="input-icon"><Icon path={ICONS.MAIL} /></span>
                                <input name="email" type="email" placeholder={t('emailAddress')} required />
                            </div>
                            <div className="input-group has-btn">
                                <span className="input-icon"><Icon path={ICONS.LOCK} /></span>
                                <input name="password" type={showPassword ? "text" : "password"} placeholder={t('password')} required />
                                <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                    <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                                </button>
                            </div>
                            <div className="input-group">
                                <span className="input-icon"><Icon path={ICONS.LOCK} /></span>
                                <input name="confirm_password" type="password" placeholder={t('confirmPassword')} required />
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <Loader /> : (isLogin ? t('signIn') : t('signUp'))}
                    </button>
                </form>

                <div className="auth-separator">{t('or')}</div>

                <button className="btn btn-secondary" onClick={() => setIsApiKeyLogin(!isApiKeyLogin)}>
                    {isApiKeyLogin ? t('signInWithEmail') : t('signInWithApiKey')}
                </button>

                <div className="auth-switch">
                    {isLogin ? t('noAccount') : t('alreadyHaveAccount')}
                    <button onClick={isLogin ? switchToRegister : switchToLogin}>{isLogin ? t('signUp') : t('signIn')}</button>
                </div>
            </div>
        </div>
    );
};

export default AuthView;