import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import { apiFetchV4 } from '../api/elasticEmail';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Icon, { ICONS } from '../components/Icon';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

const CampaignDetailModal = ({ campaign, apiKey, isOpen, onClose }: { campaign: any, apiKey: string, isOpen: boolean, onClose: () => void }) => {
    const { t, i18n } = useTranslation();
    const { data: stats, loading, error, refetch } = useApiV4(
        isOpen ? `/statistics/campaigns/${encodeURIComponent(campaign.Name)}` : '',
        apiKey
    );
    
    useEffect(() => {
      if(isOpen) {
        refetch();
      }
    }, [isOpen, refetch]);
    
    if (!isOpen) return null;
    
    const statItems = [
        { label: t('recipients'), value: stats?.Recipients },
        { label: t('emailsSent'), value: stats?.EmailTotal },
        { label: t('delivered'), value: stats?.Delivered },
        { label: t('bounced'), value: stats?.Bounced },
        { label: t('opened'), value: stats?.Opened },
        { label: t('clicked'), value: stats?.Clicked },
        { label: t('unsubscribed'), value: stats?.Unsubscribed },
        { label: t('complaints'), value: stats?.Complaints },
        { label: t('inProgress'), value: stats?.InProgress },
        { label: t('failed'), value: stats?.Failed ?? stats?.TotalFailed },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('statsForCampaign', { campaignName: campaign.Name })}>
            {loading && <CenteredMessage style={{height: 200}}><Loader/></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {stats && !loading && (
                <div className="campaign-stats-grid">
                    {statItems.map(item => (
                        (item.value !== undefined && item.value !== null) &&
                        <div key={item.label} className="campaign-stat-item">
                            <span>{(item.value).toLocaleString(i18n.language)}</span>
                            <label>{item.label}</label>
                        </div>
                    ))}
                </div>
            )}
            {!loading && !stats && !error && (
                 <CenteredMessage>{t('noStatsForCampaign')}</CenteredMessage>
            )}
        </Modal>
    );
};

const CampaignCard = ({ campaign, onSelect, stats, loadingStats }: { campaign: any; onSelect: () => void; stats: { Delivered: number, Opened: number } | null; loadingStats: boolean; }) => {
    const { t, i18n } = useTranslation();

    const getBadgeTypeForStatus = (statusName: string | undefined) => {
        const lowerStatus = (statusName || '').toLowerCase().replace(/\s/g, '');
        if (['sent', 'complete', 'completed'].includes(lowerStatus)) return 'success';
        if (lowerStatus === 'draft') return 'default';
        if (['processing', 'sending', 'inprogress', 'scheduled'].includes(lowerStatus)) return 'info';
        if (lowerStatus === 'cancelled') return 'warning';
        return 'danger';
    };

    return (
        <div className="card campaign-card">
            <div className="campaign-card-header" onClick={onSelect} role="button" tabIndex={0} onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}>
                <h3>{campaign.Name}</h3>
                <Badge text={campaign.Status ?? t('unknown')} type={getBadgeTypeForStatus(campaign.Status)} />
            </div>
            <div className="campaign-card-body">
                <p className="campaign-subject">
                    {t('subject')}: {campaign.Content?.[0]?.Subject || t('noSubject')}
                </p>
            </div>
            <div className="campaign-card-footer">
                <div className="campaign-card-footer-stats">
                    {loadingStats ? <Loader /> : (
                        stats ? (
                            <>
                                <span>{t('delivered')}: <strong>{stats.Delivered.toLocaleString(i18n.language)}</strong></span>
                                <span>{t('opened')}: <strong>{stats.Opened.toLocaleString(i18n.language)}</strong></span>
                            </>
                        ) : null
                    )}
                </div>
                <button onClick={onSelect} className="link-button campaign-card-view-link">{t('viewCampaignStats')} &rarr;</button>
            </div>
        </div>
    );
};

const CampaignsView = ({ apiKey }: { apiKey: string }) => {
    const { t } = useTranslation();
    const { data: campaigns, loading, error } = useApiV4('/campaigns', apiKey);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
    const [campaignStats, setCampaignStats] = useState<Record<string, { data?: any; loading: boolean; error?: any; }>>({});

    const filteredCampaigns = useMemo(() => {
        if (!Array.isArray(campaigns)) return [];
        return campaigns.filter((c: any) => 
            c.Name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (c.Content?.[0]?.Subject && c.Content[0].Subject.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [campaigns, searchQuery]);

    useEffect(() => {
        let isMounted = true;
    
        const fetchAllStatsSequentially = async () => {
            for (const campaign of filteredCampaigns) {
                if (!isMounted) break;
    
                // Fetch only if the campaign's stats haven't been fetched or are not currently being fetched.
                if (!campaignStats[campaign.Name]) {
                    // Set status to loading before fetching
                    if (isMounted) {
                        setCampaignStats(prev => ({ ...prev, [campaign.Name]: { loading: true } }));
                    }
                    try {
                        const result = await apiFetchV4(`/statistics/campaigns/${encodeURIComponent(campaign.Name)}`, apiKey);
                        if (isMounted) {
                            setCampaignStats(prev => ({
                                ...prev,
                                [campaign.Name]: { 
                                    loading: false, 
                                    data: {
                                        Delivered: result?.Delivered ?? 0,
                                        Opened: result?.Opened ?? 0,
                                    }
                                }
                            }));
                        }
                    } catch (err) {
                        if (isMounted) {
                            console.error(`Failed to fetch stats for campaign ${campaign.Name}`, err);
                            setCampaignStats(prev => ({
                                ...prev,
                                [campaign.Name]: { loading: false, error: err }
                            }));
                        }
                    }
                }
            }
        };
    
        if (apiKey && filteredCampaigns.length > 0) {
            fetchAllStatsSequentially();
        }
    
        return () => {
            isMounted = false;
        };
    }, [filteredCampaigns, apiKey]);

    const handleSelectCampaign = (campaign: any) => {
        setSelectedCampaign(campaign);
    };

    return (
        <div>
            {selectedCampaign && (
                <CampaignDetailModal
                    campaign={selectedCampaign}
                    apiKey={apiKey}
                    isOpen={!!selectedCampaign}
                    onClose={() => setSelectedCampaign(null)}
                />
            )}
            <div className="view-header">
                <div className="search-bar" style={{ flexGrow: 1 }}>
                    <Icon path={ICONS.SEARCH} />
                    <input
                        type="search"
                        placeholder={t('searchCampaignsPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={loading}
                        aria-label={t('searchCampaignsPlaceholder')}
                    />
                </div>
            </div>

            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}

            {!loading && !error && (
                 (!Array.isArray(campaigns) || campaigns.length === 0) ? (
                    <CenteredMessage style={{height: '50vh'}}>
                        <div className="info-message">
                            <strong>{t('noCampaignsFound')}</strong>
                            <p>{t('noCampaignsSent')}</p>
                        </div>
                    </CenteredMessage>
                ) : filteredCampaigns.length === 0 ? (
                    <CenteredMessage style={{height: '50vh'}}>
                        <div className="info-message">
                            <strong>{t('noCampaignsForQuery', { query: searchQuery })}</strong>
                        </div>
                    </CenteredMessage>
                ) : (
                    <div className="campaign-grid">
                        {filteredCampaigns.map((campaign: any) => {
                           const statsInfo = campaignStats[campaign.Name] || { loading: true };
                           return (
                               <CampaignCard 
                                    key={campaign.Name} 
                                    campaign={campaign}
                                    onSelect={() => handleSelectCampaign(campaign)}
                                    stats={statsInfo.data}
                                    loadingStats={statsInfo.loading}
                               />
                           );
                        })}
                    </div>
                )
            )}
        </div>
    );
};

export default CampaignsView;