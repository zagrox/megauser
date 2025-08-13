





import React, { useState, useEffect, ReactNode, useRef } from 'react';
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
import EmailBuilderView from './views/EmailBuilderView';
import CampaignsView from './views/CampaignsView';
import TemplatesView from './views/TemplatesView';
import DomainsView from './views/DomainsView';
import SmtpView from './views/SmtpView';
import Icon from './components/Icon';
import EmbedView from './views/EmbedView';
import ResetPasswordView from './views/ResetPasswordView';


const App = () => {
    const { isAuthenticated, loading, user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const [view, setView] = useState('Dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const appContainerRef = useRef<HTMLDivElement>(null);

    const urlParams = new URLSearchParams(window.location.search);
    const isEmbedMode = urlParams.get('embed') === 'true';
    const isResetPasswordMode = window.location.pathname.startsWith('/reset-password');

    useEffect(() => {
        if (!isEmbedMode) {
            document.documentElement.lang = i18n.language;
            document.documentElement.dir = i18n.dir();
        }
    }, [i18n.language, i18n.dir, isEmbedMode]);
    
    useEffect(() => {
        const container = appContainerRef.current;
        if (!container || isEmbedMode) return;

        let touchStartX: number | null = null;
        let touchStartY: number | null = null;

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isMobileMenuOpen || touchStartX === null || touchStartY === null) {
                return;
            }

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - touchStartX;
            const deltaY = currentY - touchStartY;

            // Make sure it's a horizontal swipe, not a scroll
            if (Math.abs(deltaX) < Math.abs(deltaY) * 1.5) {
                return;
            }
            
            const isRTL = i18n.dir() === 'rtl';
            const screenWidth = window.innerWidth;
            const edgeThreshold = 50; // Swipes must start within 50px of an edge
            const swipeThreshold = 50; // Must swipe at least 50px

            let shouldOpen = false;

            if (isRTL) {
                const isAtRightEdge = touchStartX > screenWidth - edgeThreshold;
                const isSwipingLeft = deltaX < -swipeThreshold;
                if (isAtRightEdge && isSwipingLeft) {
                    shouldOpen = true;
                }
            } else {
                const isAtLeftEdge = touchStartX < edgeThreshold;
                const isSwipingRight = deltaX > swipeThreshold;
                if (isAtLeftEdge && isSwipingRight) {
                    shouldOpen = true;
                }
            }

            if (shouldOpen) {
                setIsMobileMenuOpen(true);
                touchStartX = null;
                touchStartY = null;
            }
        };

        const handleTouchEnd = () => {
            touchStartX = null;
            touchStartY = null;
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [isMobileMenuOpen, i18n, isEmbedMode, setIsMobileMenuOpen]);

    if (isResetPasswordMode) {
        return <ResetPasswordView />;
    }

    if (isEmbedMode) {
        return <EmbedView />;
    }

    if (loading) {
        return <CenteredMessage style={{height: '100vh'}}><Loader /></CenteredMessage>;
    }

    if (!isAuthenticated) {
        return <AuthView />;
    }
    
    const apiKey = user?.panelkey;
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
        'Campaigns': { component: <CampaignsView apiKey={apiKey} setView={handleSetView} />, title: t('campaigns'), icon: ICONS.CAMPAIGNS },
        'Templates': { component: <TemplatesView apiKey={apiKey} setView={handleSetView} />, title: t('templates'), icon: ICONS.ARCHIVE },
        'Email Builder': { component: <EmailBuilderView apiKey={apiKey} user={user} />, title: t('emailBuilder'), icon: ICONS.SEND_EMAIL },
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
        { name: t('templates'), view: 'Templates', icon: ICONS.ARCHIVE },
        { name: t('emailBuilder'), view: 'Email Builder', icon: ICONS.SEND_EMAIL },
    ];
    
    const SidebarContent = () => (
      <>
        <div className="sidebar-header">
            <img src="https://mailzila.com/logo.png" alt="Mailzila logo" className="sidebar-logo" />
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
        </div>
      </>
    );
    
    const currentView = views[view];
    const showHeader = view !== 'Dashboard' && view !== 'Email Builder';

    return (
        <div ref={appContainerRef} className={`app-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="sidebar">
                <SidebarContent />
            </aside>
            <div className="main-wrapper">
                <header className="mobile-header">
                     <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)} aria-label={t('openMenu')}>
                        <Icon path={ICONS.MENU} />
                    </button>
                    <h1 className="mobile-header-title">{currentView?.title || 'Mailzila'}</h1>
                    <button className="mobile-menu-toggle" onClick={() => handleSetView('Account')} aria-label={t('account')}>
                        <Icon path={ICONS.ACCOUNT} />
                    </button>
                </header>
                <main className="content">
                    {showHeader && (
                        <header className="content-header">
                            <h2>{currentView?.title}</h2>
                        </header>
                    )}
                    {currentView?.component}
                </main>
            </div>
        </div>
    );
};

export default App;