import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useApi from '../hooks/useApi';
import useApiV4 from '../hooks/useApiV4';
import { getPastDateByDays, formatDateForApiV4 } from '../utils/helpers';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import AccountDataCard from '../components/AccountDataCard';
import Icon, { ICONS } from '../components/Icon';

const DashboardView = ({ setView, apiKey, user }: { setView: (view: string) => void, apiKey: string, user: any }) => {
    const { t, i18n } = useTranslation();
    const apiParams = useMemo(() => ({ from: formatDateForApiV4(getPastDateByDays(365)) }), []);
    const { data: statsData, loading: statsLoading, error: statsError } = useApiV4(`/statistics`, apiKey, apiParams);
    const { data: accountData, loading: accountLoading } = useApi('/account/load', apiKey, {}, apiKey ? 1 : 0);
    const { data: contactsCountData, loading: contactsCountLoading } = useApi('/contact/count', apiKey, { allContacts: true }, apiKey ? 1 : 0);

    const navItems = [
        { name: t('statistics'), icon: ICONS.STATISTICS, desc: t('statisticsDesc'), view: 'Statistics' },
        { name: t('contacts'), icon: ICONS.CONTACTS, desc: t('contactsDesc'), view: 'Contacts' },
        { name: t('emailLists'), icon: ICONS.EMAIL_LISTS, desc: t('emailListsDesc'), view: 'Email Lists' },
        { name: t('segments'), icon: ICONS.SEGMENTS, desc: t('segmentsDesc'), view: 'Segments' },
        { name: t('mediaManager'), icon: ICONS.FOLDER, desc: t('mediaManagerDesc'), view: 'Media Manager' },
        { name: t('sendEmail'), icon: ICONS.SEND_EMAIL, desc: t('sendEmailDesc'), view: 'Send Email' },
        { name: t('campaigns'), icon: ICONS.CAMPAIGNS, desc: t('campaignsDesc'), view: 'Campaigns' },
        { name: t('domains'), icon: ICONS.DOMAINS, desc: t('domainsDesc'), view: 'Domains' },
        { name: t('smtp'), icon: ICONS.SMTP, desc: t('smtpDesc'), view: 'SMTP' },
    ];
    
    if (!user) return <CenteredMessage><Loader /></CenteredMessage>;
    if (statsError) console.warn("Could not load dashboard stats:", statsError);

    const welcomeName = user?.first_name || t('user');

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h2>{t('welcomeMessage', { name: welcomeName })}</h2>
                    <p>{t('dashboardSubtitle')}</p>
                </div>
                <div className="dashboard-actions">
                    <button className="btn btn-credits" onClick={() => setView('Buy Credits')}>
                        <Icon path={ICONS.BUY_CREDITS} />
                        {accountLoading ? t('loadingCredits') : `${t('credits')}: ${Number(accountData?.emailcredits ?? 0).toLocaleString(i18n.language)}`}
                    </button>
                    <button className="btn btn-primary" onClick={() => setView('Send Email')}><Icon path={ICONS.SEND_EMAIL} /> {t('sendAnEmail')}</button>
                </div>
            </div>

            <div className="dashboard-stats-grid">
                 <AccountDataCard title={t('sendingReputation')} iconPath={ICONS.TRENDING_UP}>
                    {accountLoading ? '...' : (accountData?.reputation ? `${accountData.reputation}%` : 'N/A')}
                </AccountDataCard>
                <AccountDataCard title={t('emailsSent365d')} iconPath={ICONS.MAIL}>
                    {statsLoading ? '...' : (statsData?.EmailTotal?.toLocaleString(i18n.language) ?? '0')}
                </AccountDataCard>
                 <AccountDataCard title={t('totalContacts')} iconPath={ICONS.CONTACTS}>
                    {contactsCountLoading ? '...' : (contactsCountData?.toLocaleString(i18n.language) ?? '0')}
                </AccountDataCard>
            </div>

            <div className="dashboard-section">
                <div className="dashboard-section-header">
                    <h3>{t('exploreYourTools')}</h3>
                    <p>{t('exploreYourToolsSubtitle')}</p>
                </div>
                <div className="dashboard-nav-grid">
                    {navItems.map(item => (
                        <div key={item.name} className="card nav-card clickable" onClick={() => setView(item.view)}>
                            <Icon path={item.icon} className="nav-card-icon" />
                            <div className="nav-card-title">{item.name}</div>
                            <div className="nav-card-description">{item.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="dashboard-branding-footer">
                <p>Mailzila App by <strong>ZAGROX.com</strong></p>
            </div>
        </div>
    );
};

export default DashboardView;