

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import useApi from './useApi';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import { ICONS } from '../components/Icon';
import Tabs from '../components/Tabs';
import GeneralTab from './account/GeneralTab';
import ProfileTab from './account/ProfileTab';
import ApiKeyTab from './account/ApiKeyTab';
import SecurityTab from './account/SecurityTab';
import ShareTab from './account/ShareTab';
import DomainsView from './DomainsView';
import SmtpView from './SmtpView';

const AccountView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t } = useTranslation();
    const { data: accountData, loading: accountLoading, error: accountError } = useApi('/account/load', apiKey, {}, apiKey ? 1 : 0);
    const { data: contactsCountData, loading: contactsCountLoading } = useApi('/contact/count', apiKey, { allContacts: true }, apiKey ? 1 : 0);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    
    const handleInstallClick = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
    };

    if (!apiKey) {
        return (
            <div className="account-view-container">
                <CenteredMessage>
                    <div className="info-message">
                        <strong>{t('noApiKeyFound')}</strong>
                        <p>{t('addKeyToViewAccount')}</p>
                    </div>
                </CenteredMessage>
            </div>
        );
    }

    if (accountLoading) {
        return <div className="account-view-container"><CenteredMessage><Loader /></CenteredMessage></div>;
    }

    const isApiKeyUser = user?.isApiKeyUser;

    const tabs = [
        { id: 'general', label: t('general'), icon: ICONS.DASHBOARD, component: <GeneralTab accountData={accountData} contactsCountData={contactsCountData} contactsCountLoading={contactsCountLoading} installPrompt={installPrompt} handleInstallClick={handleInstallClick} /> },
        { id: 'profile', label: t('profile'), icon: ICONS.ACCOUNT, component: <ProfileTab accountData={accountData} user={user} /> },
        { id: 'api_key', label: t('apiKey'), icon: ICONS.KEY, component: <ApiKeyTab apiKey={apiKey} /> },
        { id: 'security', label: t('security'), icon: ICONS.DOMAINS, component: <SecurityTab isApiKeyUser={isApiKeyUser} /> },
        { id: 'domains', label: t('domains'), icon: ICONS.LANGUAGE, component: <DomainsView apiKey={apiKey} /> },
        { id: 'smtp', label: t('smtp'), icon: ICONS.SMTP, component: <SmtpView apiKey={apiKey} user={user} /> },
        { id: 'share', label: t('share'), icon: ICONS.SHARE, component: <ShareTab apiKey={apiKey} /> },
    ];
    
    return (
        <div className="account-view-container">
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
        </div>
    );
};

export default AccountView;