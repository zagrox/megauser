import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Icon, { ICONS } from '../components/Icon';
import Badge from '../components/Badge';

const CampaignStatCard = ({ campaign, apiKey }: { campaign: any; apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const { data: stats, loading } = useApiV4(
        `/statistics/campaigns/${encodeURIComponent(campaign.Name)}`,
        apiKey
    );

    const getBadgeTypeForStatus = (statusName: string | undefined) => {
        const lowerStatus = (statusName || '').toLowerCase();
        if (lowerStatus === 'sent' || lowerStatus === 'complete' || lowerStatus === 'completed') return 'success';
        if (lowerStatus === 'draft') return 'default';
        if (lowerStatus === 'processing' || lowerStatus === 'sending' || lowerStatus === 'inprogress' || lowerStatus === 'scheduled') return 'info';
        if (lowerStatus === 'cancelled') return 'warning';
        return 'default';
    };
    
    const statItems = !loading && stats ? [
        { label: t('delivered'), value: stats.Delivered },
        { label: t('opened'), value: stats.Opened },
        { label: t('clicked'), value: stats.Clicked },
        { label: t('unsubscribed'), value: stats.Unsubscribed },
    ] : [];

    return (
        <div className="card campaign-card">
            <div className="campaign-card-header">
                <h3>{campaign.Name}</h3>
                <Badge text={campaign.Status ?? t('unknown')} type={getBadgeTypeForStatus(campaign.Status)} />
            </div>
            <div className="campaign-card-body">
                <p className="campaign-subject">
                    {campaign.Content?.[0]?.Subject || t('noSubject')}
                </p>
                <div className="campaign-stats-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}>
                            <Loader />
                        </div>
                    ) : (
                        statItems.map(item => (
                            <div key={item.label} className="campaign-stat-item">
                                <span>{(item.value ?? 0).toLocaleString(i18n.language)}</span>
                                <label>{item.label}</label>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};


const CampaignsView = ({ apiKey }: { apiKey: string }) => {
    const { t } = useTranslation();
    const { data: campaigns, loading, error } = useApiV4('/campaigns', apiKey);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCampaigns = useMemo(() => {
        if (!Array.isArray(campaigns)) return [];
        return campaigns.filter((c: any) => 
            c.Name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (c.Content?.[0]?.Subject && c.Content[0].Subject.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [campaigns, searchQuery]);

    return (
        <div>
            <div className="view-header">
                <div className="search-bar">
                    <Icon path={ICONS.SEARCH} />
                    <input
                        type="search"
                        placeholder={t('searchCampaignsPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={loading}
                    />
                </div>
            </div>

            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}

            {!loading && !error && (
                 (!Array.isArray(campaigns) || campaigns.length === 0) ? (
                    <CenteredMessage>{t('noCampaignsFound')}</CenteredMessage>
                ) : filteredCampaigns.length === 0 ? (
                    <CenteredMessage>
                        {searchQuery ? t('noCampaignsForQuery', { query: searchQuery }) : t('noCampaignsSent')}
                    </CenteredMessage>
                ) : (
                    <div className="campaign-grid">
                        {filteredCampaigns.map((campaign: any) => (
                           <CampaignStatCard key={campaign.Name} campaign={campaign} apiKey={apiKey} />
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default CampaignsView;