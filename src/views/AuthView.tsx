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
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            if (isApiKeyLogin) {
                await loginWithApiKey(data.apikey as string);
            } else if (isLogin) {
                await login({ email: data.email, password: data.password });
            } else {
                if (data.password !== data.confirm_password) {
                    throw new Error(t('passwordsDoNotMatch'));
                }
                await register({ email: data.email, password: data.password, first_name: data.first_name });
            }
        } catch (err: any) {
            setError(err.message || t('unknownError'));
        } finally {
            setLoading(false);
        }
    };
    
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
                        <div className="input-group">
                            <input name="apikey" type={showPassword ? "text" : "password"} placeholder={t('enterYourApiKey')} required />
                            <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                            </button>
                        </div>
                    ) : (
                        <div className="form-grid" style={{gridTemplateColumns: '1fr', gap: '1rem'}}>
                            {!isLogin && (
                                <input name="first_name" type="text" placeholder={t('firstName')} required />
                            )}
                            <input name="email" type="email" placeholder={t('emailAddress')} required />
                            <div className="input-group">
                                <input name="password" type={showPassword ? "text" : "password"} placeholder={t('password')} required />
                                <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                    <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                                </button>
                            </div>
                            {!isLogin && (
                                 <input name="confirm_password" type="password" placeholder={t('confirmPassword')} required />
                            )}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <Loader /> : (isLogin ? t('signIn') : t('createAccount'))}
                    </button>
                </form>

                <div className="auth-separator">{t('or')}</div>

                <button className="btn btn-secondary" onClick={() => setIsApiKeyLogin(!isApiKeyLogin)}>
                    {isApiKeyLogin ? t('signInWithEmail') : t('signInWithApiKey')}
                </button>

                <div className="auth-switch">
                    {isLogin ? t('noAccount') : t('alreadyHaveAccount')}
                    <button onClick={() => setIsLogin(!isLogin)}>{isLogin ? t('signUp') : t('signIn')}</button>
                </div>
            </div>
        </div>
    );
};

export default AuthView;