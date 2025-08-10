import React, { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './contexts/AuthContext';
import { ICONS } from './components/Icon';
import CenteredMessage from './components/CenteredMessage';
import Loader from './components/Loader';
import AuthView from './views/AuthView';
import OnboardingView from './views/OnboardingView';
import DashboardView from './views/DashboardView';
import StatisticsView from './views/StatisticsView';
import AccountView from './views/AccountView';
import BuyCreditsView from './views/BuyCreditsView';
import ContactsView from './views/ContactsView';
import EmailListView from './views/EmailListView';
import SegmentsView from './views/SegmentsView';
import MediaManagerView from './views/MediaManagerView';
import SendEmailView from './views/SendEmailView';
import CampaignsView from './views/CampaignsView';
import DomainsView from './views/DomainsView';
import SmtpView from './views/SmtpView';
import Icon from './components/Icon';


const App = () => {
    const { isAuthenticated, loading, user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const [view, setView] = useState('Dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        document.documentElement.lang = i18n.language;
        document.documentElement.dir = i18n.dir();
    }, [i18n.language, i18n.dir]);

    if (loading) {
        return <CenteredMessage style={{height: '100vh'}}><Loader /></CenteredMessage>;
    }

    if (!isAuthenticated) {
        return <AuthView />;
    }
    
    const apiKey = user?.elastic_email_api_key;
    if (!apiKey) {
        return <OnboardingView />;
    }

    const handleLogout = () => {
        logout();
        setView('Dashboard');
    };

    const handleSetView = (newView: string) => {
        setView(newView);
        setIsMobileMenuOpen(false);
    }
    
    const views: Record<string, { component: ReactNode, title: string, icon: string }> = {
        'Dashboard': { component: <DashboardView setView={handleSetView} apiKey={apiKey} user={user} />, title: t('dashboard'), icon: ICONS.DASHBOARD },
        'Statistics': { component: <StatisticsView apiKey={apiKey} />, title: t('statistics'), icon: ICONS.STATISTICS },
        'Account': { component: <AccountView apiKey={apiKey} user={user} />, title: t('account'), icon: ICONS.ACCOUNT },
        'Buy Credits': { component: <BuyCreditsView apiKey={apiKey} user={user} />, title: t('buyCredits'), icon: ICONS.BUY_CREDITS },
        'Contacts': { component: <ContactsView apiKey={apiKey} />, title: t('contacts'), icon: ICONS.CONTACTS },
        'Email Lists': { component: <EmailListView apiKey={apiKey} />, title: t('emailLists'), icon: ICONS.EMAIL_LISTS },
        'Segments': { component: <SegmentsView apiKey={apiKey} />, title: t('segments'), icon: ICONS.SEGMENTS },
        'Media Manager': { component: <MediaManagerView apiKey={apiKey} />, title: t('mediaManager'), icon: ICONS.FOLDER },
        'Send Email': { component: <SendEmailView apiKey={apiKey} user={user} />, title: t('sendEmail'), icon: ICONS.SEND_EMAIL },
        'Campaigns': { component: <CampaignsView apiKey={apiKey} />, title: t('campaigns'), icon: ICONS.CAMPAIGNS },
        'Domains': { component: <DomainsView apiKey={apiKey} />, title: t('domains'), icon: ICONS.DOMAINS },
        'SMTP': { component: <SmtpView apiKey={apiKey} user={user}/>, title: t('smtp'), icon: ICONS.SMTP }
    };

    const navItems = [
        { name: t('dashboard'), view: 'Dashboard', icon: ICONS.DASHBOARD },
        { name: t('statistics'), view: 'Statistics', icon: ICONS.STATISTICS },
        { name: t('contacts'), view: 'Contacts', icon: ICONS.CONTACTS },
        { name: t('emailLists'), view: 'Email Lists', icon: ICONS.EMAIL_LISTS },
        { name: t('segments'), view: 'Segments', icon: ICONS.SEGMENTS },
        { name: t('mediaManager'), view: 'Media Manager', icon: ICONS.FOLDER },
        { name: t('campaigns'), view: 'Campaigns', icon: ICONS.CAMPAIGNS },
        { name: t('sendEmail'), view: 'Send Email', icon: ICONS.SEND_EMAIL },
        { name: t('domains'), view: 'Domains', icon: ICONS.DOMAINS },
        { name: t('smtp'), view: 'SMTP', icon: ICONS.SMTP },
    ];
    
    const SidebarContent = () => (
      <>
        <div className="sidebar-header">
            <img src="https://mailzila.com/wp-content/uploads/mailzila-logo-dark-red.png" alt="Mailzila logo" className="sidebar-logo" />
            <span className="logo-font">Mailzila</span>
        </div>
        <nav className="nav">
            {navItems.map(item => (
                <button key={item.view} onClick={() => handleSetView(item.view)} className={`nav-btn ${view === item.view ? 'active' : ''}`}>
                    <Icon path={item.icon} />
                    <span>{item.name}</span>
                </button>
            ))}
        </nav>
        <div className="sidebar-footer-nav">
             <button onClick={() => handleSetView('Buy Credits')} className={`nav-btn ${view === 'Buy Credits' ? 'active' : ''}`}>
                <Icon path={ICONS.BUY_CREDITS} />
                <span>{t('buyCredits')}</span>
             </button>
             <button onClick={() => handleSetView('Account')} className={`nav-btn ${view === 'Account' ? 'active' : ''}`}>
                 <Icon path={ICONS.ACCOUNT} />
                 <span>{t('account')}</span>
             </button>
            <button onClick={handleLogout} className="nav-btn logout-btn">
                <Icon path={ICONS.LOGOUT} />
                <span>{t('logout')}</span>
            </button>
        </div>
      </>
    );

    return (
        <div className={`app-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="sidebar">
                <SidebarContent />
            </aside>
            <div className="main-wrapper">
                <header className="mobile-header">
                     <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)} aria-label={t('openMenu')}>
                        <Icon path={ICONS.MENU} />
                    </button>
                    <h1 className="mobile-header-title">{views[view]?.title || 'Mailzila'}</h1>
                    <div className="mobile-header-placeholder"></div>
                </header>
                <main className="content">
                    <header className="content-header">
                        <h2>{views[view]?.title}</h2>
                    </header>
                    {views[view]?.component}
                </main>
            </div>
        </div>
    );
};

export default App;
