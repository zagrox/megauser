import React from 'react';
import { useTranslation } from 'react-i18next';
import CenteredMessage from './CenteredMessage';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import { formatAxisLabel } from '../utils/helpers';

const BAR_CHART_COLORS: { [key: string]: string } = {
    Delivered: '#3B82F6', // Blue
    Opened: '#10B981', // Green
    Bounced: '#64748B', // Slate
    Clicked: '#F59E0B', // Amber
    Unsubscribed: '#8B5CF6', // Violet
    Complaints: '#EF4444', // Red
};

const OverallActivityChart = ({ stats, loading, error }: { stats: any, loading: boolean, error: any }) => {
    const { t, i18n } = useTranslation();

    if (loading) return <CenteredMessage style={{height: '350px'}}><Loader /></CenteredMessage>;
    if (error) return <ErrorMessage error={error} />;
    if (!stats || Object.keys(stats).length === 0) return <CenteredMessage style={{height: '350px'}}>{t('noOverallActivity')}</CenteredMessage>;

    const chartData = [
        { name: t('delivered'), value: stats.Delivered ?? 0, color: BAR_CHART_COLORS.Delivered },
        { name: t('opened'), value: stats.Opened ?? 0, color: BAR_CHART_COLORS.Opened },
        { name: t('bounced'), value: stats.Bounced ?? 0, color: BAR_CHART_COLORS.Bounced },
        { name: t('clicked'), value: stats.Clicked ?? 0, color: BAR_CHART_COLORS.Clicked },
        { name: t('unsubscribed'), value: stats.Unsubscribed ?? 0, color: BAR_CHART_COLORS.Unsubscribed },
        { name: t('complaints'), value: stats.Complaints ?? 0, color: BAR_CHART_COLORS.Complaints },
    ].sort((a, b) => b.value - a.value); // Sort descending

    const maxValue = Math.max(...chartData.map(d => d.value), 1);
    
    return (
        <div style={{ padding: '1.25rem 1.25rem 1.25rem 4rem' }}>
            <div style={{ display: 'flex', height: '300px', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                {/* Y-Axis Labels */}
                {[...Array(5)].map((_, i) => {
                    const value = i === 4 ? 0 : Math.ceil(maxValue - (i * (maxValue / 4)));
                    return (
                        <div key={i} style={{ position: 'absolute', top: `${(i/4) * 100}%`, left: 0, transform: 'translateY(-50%)', width: '100%' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--subtle-text-color)', position: 'absolute', left: '-10px', transform: 'translateX(-100%)', whiteSpace: 'nowrap' }}>
                                {formatAxisLabel(value, i18n.language)}
                            </span>
                            <div style={{ borderTop: '1px dotted var(--border-color)', width: '100%', height: '1px' }}></div>
                        </div>
                    );
                })}

                {/* Bars */}
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', width: '100%', height: '100%', zIndex: 1, paddingLeft: '2rem' }}>
                    {chartData.map(item => (
                        <div key={item.name} style={{ width: '12%', textAlign: 'center' }}>
                            <div
                                style={{
                                    height: `${(item.value / maxValue) * 100}%`,
                                    backgroundColor: item.color,
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.3s ease-in-out',
                                    minHeight: '2px'
                                }}
                                title={`${item.name}: ${item.value.toLocaleString(i18n.language)}`}
                            ></div>
                        </div>
                    ))}
                </div>
            </div>
             {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                {chartData.map(item => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '12px', height: '12px', backgroundColor: item.color, borderRadius: '3px' }}></span>
                        <span>{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default OverallActivityChart;