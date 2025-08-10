import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import useApi from '../hooks/useApi';
import useApiV4 from '../hooks/useApiV4';
import { apiFetch } from '../api/elasticEmail';
import { formatDateForDisplay } from '../utils/helpers';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import AccountDataCard from '../components/AccountDataCard';
import Badge from '../components/Badge';
import { ICONS } from '../components/Icon';
import ThemeSwitcher from '../components/ThemeSwitcher';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Icon from '../components/Icon';
import ActionStatus from '../components/ActionStatus';

const AccountView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t, i18n } = useTranslation();
    const { updateUser, logout } = useAuth();
    const { data, loading, error } = useApi('/account/load', apiKey, {}, apiKey ? 1 : 0);
    const { data: contactsCountData, loading: contactsCountLoading } = useApi('/contact/count', apiKey, { allContacts: true }, apiKey ? 1 : 0);
    const [newApiKey, setNewApiKey] = useState(user.elastic_email_api_key || '');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            console.log('`beforeinstallprompt` event fired.');
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);
    
    const handleInstallClick = () => {
        if (!installPrompt) return;
        
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            setInstallPrompt(null);
        });
    };

    const handleSaveKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus(null);
        try {
            await apiFetch('/account/load', newApiKey);
            await updateUser({ elastic_email_api_key: newApiKey });
            setStatus({ type: 'success', message: t('apiKeyUpdateSuccess') });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || t('apiKeyUpdateError') });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!apiKey) return (
        <CenteredMessage>
            <div className="info-message">
                <strong>{t('noApiKeyFound')}</strong>
                <p>{t('addKeyToViewAccount')}</p>
            </div>
        </CenteredMessage>
    );
    if (loading) return <CenteredMessage><Loader /></CenteredMessage>;
    if (error) return <ErrorMessage error={error} />;
    if (!data) return <CenteredMessage>{t('noAccountData')}</CenteredMessage>;

    const getStatusType = (status: string) => {
        const cleanStatus = String(status || '').toLowerCase().replace(/\s/g, '');
        if (cleanStatus.includes('active')) return 'success';
        if (cleanStatus.includes('disabled') || cleanStatus.includes('abuse')) return 'danger';
        if (cleanStatus.includes('review') || cleanStatus.includes('verification')) return 'warning';
        return 'default';
    }

    const getReputationInfo = (reputation: number) => {
        const score = Number(reputation || 0);
        if (score >= 80) return { text: t('reputationExcellent'), className: 'good' };
        if (score >= 60) return { text: t('reputationGood'), className: 'good' };
        if (score >= 40) return { text: t('reputationAverage'), className: 'medium' };
        if (score >= 20) return { text: t('reputationPoor'), className: 'bad' };
        return { text: t('reputationVeryPoor'), className: 'bad' };
    };
    
    const accountStatus = data.status || 'Active';
    const statusType = getStatusType(accountStatus);
    const reputation = getReputationInfo(data.reputation);
    const fullName = [data.firstname, data.lastname].filter(Boolean).join(' ') || user.first_name;
    const isApiKeyUser = user?.isApiKeyUser;

    return (
        <div className="profile-view-container">
            {!isApiKeyUser && (
                <div className="profile-hero">
                    <div className="profile-avatar">
                        <Icon path={ICONS.ACCOUNT} />
                    </div>
                    <div className="profile-info">
                        <h3>{fullName || t('userProfile')}</h3>
                        <p className="profile-email">{data.email}</p>
                        <div className="profile-meta">
                            <div className="meta-item">
                                <label>{t('publicId')}</label>
                                <span>{data.publicaccountid || 'N/A'}</span>
                            </div>
                            <div className="meta-item">
                                <label>{t('joined')}</label>
                                <span>{formatDateForDisplay(data.datecreated, i18n.language)}</span>
                            </div>
                            <div className="meta-item">
                                <label>{t('lastActivity')}</label>
                                <span>{formatDateForDisplay(data.lastactivity, i18n.language)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="card">
                <div className="card-header" style={{padding: '1.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem'}}>
                    <h3 style={{margin:0, fontSize: '1.25rem'}}>{t('settings')}</h3>
                </div>
                <div className="card-body" style={{padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '2.5rem'}}>
                    <div>
                        <h4 style={{fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem'}}>{t('displayMode')}</h4>
                        <p style={{color: 'var(--subtle-text-color)', marginTop: 0, marginBottom: '1rem', fontSize: '0.9rem'}}>{t('displayModeSubtitle')}</p>
                        <ThemeSwitcher />
                    </div>
                    
                    <div>
                        <h4 style={{fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem'}}>{t('language')}</h4>
                        <p style={{color: 'var(--subtle-text-color)', marginTop: 0, marginBottom: '1rem', fontSize: '0.9rem'}}>{t('languageSubtitle')}</p>
                        <LanguageSwitcher />
                    </div>

                    {installPrompt && (
                        <div>
                            <h4 style={{fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem'}}>{t('installApp')}</h4>
                            <p style={{color: 'var(--subtle-text-color)', marginTop: 0, marginBottom: '1rem', fontSize: '0.9rem'}}>{t('installAppSubtitle')}</p>
                            <button className="btn btn-secondary" onClick={handleInstallClick} style={{width: '100%'}}>
                                <Icon path={ICONS.DOWNLOAD} /> {t('installMegaMail')}
                            </button>
                        </div>
                    )}
                    
                    {!isApiKeyUser && (
                        <div>
                             <h4 style={{fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem'}}>{t('apiKey')}</h4>
                             <form onSubmit={handleSaveKey} style={{padding: 0}}>
                                <div className="form-group">
                                    <label htmlFor="api-key-input">{t('yourApiKey')}</label>
                                    <input
                                        id="api-key-input"
                                        type="password"
                                        value={newApiKey}
                                        onChange={(e) => setNewApiKey(e.target.value)}
                                        placeholder={t('enterYourApiKey')}
                                        required
                                    />
                                </div>
                                {status && <ActionStatus status={status} onDismiss={() => setStatus(null)}/>}
                                <div className="form-actions" style={{justifyContent: 'flex-end', marginTop: '1rem', padding: 0}}>
                                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                        {isSaving ? <Loader /> : t('saveAndVerifyKey')}
                                    </button>
                                </div>
                             </form>
                        </div>
                    )}
                </div>
            </div>

            {isApiKeyUser && (
                 <div className="info-message" style={{textAlign: 'left'}}>
                    <p>
                        {t('apiKeySignInMessage')} <button className="link-button" onClick={logout}>{t('logOut')}</button> {t('andRegister')}
                    </p>
                </div>
            )}

            <div className="card-grid account-grid">
                <AccountDataCard title={t('accountStatus')} iconPath={ICONS.VERIFY}>
                    <Badge text={accountStatus} type={statusType} />
                </AccountDataCard>
                <AccountDataCard title={t('reputation')} iconPath={ICONS.TRENDING_UP}>
                    <span className={`reputation-score ${reputation.className}`}>{data.reputation ?? 0}%</span>
                    <span className="reputation-text">{reputation.text}</span>
                </AccountDataCard>
                <AccountDataCard title={t('dailySendLimit')} iconPath={ICONS.SEND_EMAIL}>
                    {(data.dailysendlimit ?? 0).toLocaleString(i18n.language)}
                </AccountDataCard>
                 <AccountDataCard title={t('remainingCredits')} iconPath={ICONS.BUY_CREDITS}>
                    {(data?.emailcredits === undefined) ? 'N/A' : Number(data.emailcredits).toLocaleString(i18n.language)}
                </AccountDataCard>
                <AccountDataCard title={t('totalContacts')} iconPath={ICONS.CONTACTS}>
                    {contactsCountLoading ? '...' : (contactsCountData?.toLocaleString(i18n.language) ?? '0')}
                </AccountDataCard>
            </div>
        </div>
    );
};

export default AccountView;