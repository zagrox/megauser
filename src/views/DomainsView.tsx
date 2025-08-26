import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import { apiFetchV4 } from '../api/elasticEmail';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useToast } from '../contexts/ToastContext';
import Icon, { ICONS } from '../components/Icon';
import Badge from '../components/Badge';
import ConfirmModal from '../components/ConfirmModal';
import { useStatusStyles } from '../hooks/useStatusStyles';
import Modal from '../components/Modal';

const DNS_RECORDS_CONFIG = {
    SPF: {
        type: 'TXT',
        name: (domain: string) => domain,
        expectedValue: 'v=spf1 a mx include:mailzila.com ~all',
        check: (data: string) => data.includes('v=spf1') && data.includes('include:mailzila.com'),
        host: '@ or your domain',
    },
    DKIM: {
        type: 'TXT',
        name: (domain: string) => `api._domainkey.${domain}`,
        expectedValue: 'k=rsa;t=s;p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbmGbQMzYeMvxwtNQoXN0waGYaciuKx8mtMh5czguT4EZlJXuCt6V+l56mmt3t68FEX5JJ0q4ijG71BGoFRkl87uJi7LrQt1ZZmZCvrEII0YO4mp8sDLXC8g1aUAoi8TJgxq2MJqCaMyj5kAm3Fdy2tzftPCV/lbdiJqmBnWKjtwIDAQAB',
        check: (data: string) => data.includes('k=rsa;') && data.includes('p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbmGbQMzYeMvxwtNQoXN0waGYaciuKx8mtMh5czguT4EZlJXuCt6V+l56mmt3t68FEX5JJ0q4ijG71BGoFRkl87uJi7LrQt1ZZmZCvrEII0YO4mp8sDLXC8g1aUAoi8TJgxq2MJqCaMyj5kAm3Fdy2tzftPCV/lbdiJqmBnWKjtwIDAQAB'),
        host: 'api._domainkey',
    },
    Tracking: {
        type: 'CNAME',
        name: (domain: string) => `tracking.${domain}`,
        expectedValue: 'app.mailzila.com',
        check: (data: string) => data.includes('app.mailzila.com'),
        host: 'tracking',
    },
    DMARC: {
        type: 'TXT',
        name: (domain: string) => `_dmarc.${domain}`,
        expectedValue: 'v=DMARC1;p=none;pct=10;aspf=r;adkim=r;',
        check: (data: string) => data.includes('v=DMARC1'),
        host: '_dmarc',
    },
};

type VerificationStatus = 'idle' | 'checking' | 'verified' | 'failed';

const SetDefaultSenderModal = ({ isOpen, onClose, domain, apiKey, onSuccess }: { isOpen: boolean; onClose: () => void; domain: any; apiKey: string; onSuccess: () => void; }) => {
    const { t } = useTranslation();
    const [localPart, setLocalPart] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const defaultSender = domain?.DefaultSender || domain?.defaultsender;
        if (defaultSender) {
            setLocalPart(defaultSender.split('@')[0]);
        } else {
            setLocalPart('mailer'); // Default value
        }
    }, [domain]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const fullEmail = `${localPart}@${domain.Domain}`;
        try {
            await apiFetchV4(`/domains/${encodeURIComponent(fullEmail)}/default`, apiKey, {
                method: 'PATCH',
            });
            addToast('Default sender updated successfully!', 'success');
            onSuccess();
        } catch (err: any) {
            addToast(`Failed to update: ${err.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('Default sender')}`}>
            <form onSubmit={handleSubmit} className="modal-form">
                <p>Default sender is an email address used in your emails as a 'From' address. We strongly recommend setting a default sender to help increase your deliverability performance.</p>
                <div className="form-group">
                    <label htmlFor="email-local-part">{t('emailAddress')}</label>
                    <div className="from-email-composer">
                        <input
                            id="email-local-part"
                            type="text"
                            value={localPart}
                            onChange={e => setLocalPart(e.target.value.trim())}
                            required
                        />
                        <span className="from-email-at">@{domain.Domain}</span>
                    </div>
                </div>
                <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                    <button type="button" className="btn" onClick={onClose} disabled={isSaving}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving || !localPart}>
                        {isSaving ? <Loader /> : t('saveChanges')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


const VerificationStatusIndicator = ({ status }: { status: VerificationStatus }) => {
    const { t } = useTranslation();
    const { getStatusStyle } = useStatusStyles();

    switch (status) {
        case 'checking':
            const checkingStyle = getStatusStyle('Checking');
            return <span className="verification-status"><Badge text={t('checking')} type={checkingStyle.type} iconPath={checkingStyle.iconPath} /></span>;
        case 'verified':
            const verifiedStyle = getStatusStyle('Verified');
            return <span className="verification-status"><Badge text={t('verified')} type={verifiedStyle.type} iconPath={verifiedStyle.iconPath} /></span>;
        case 'failed':
             const failedStyle = getStatusStyle('Failed');
            return <span className="verification-status"><Badge text={t('notVerified')} type={failedStyle.type} iconPath={failedStyle.iconPath} /></span>;
        default:
            return null;
    }
};

const DomainVerificationChecker = ({ domainName }: { domainName: string }) => {
    const { t } = useTranslation();
    const [statuses, setStatuses] = useState<Record<string, { status: VerificationStatus }>>(
      Object.keys(DNS_RECORDS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: { status: 'idle' } }), {})
    );
    const [isChecking, setIsChecking] = useState(false);

    const checkAllDns = async () => {
        setIsChecking(true);
        setStatuses(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: { status: 'checking' } }), {}));

        for (const [key, config] of Object.entries(DNS_RECORDS_CONFIG)) {
            try {
                const response = await fetch(`https://dns.google/resolve?name=${config.name(domainName)}&type=${config.type}`);
                if (!response.ok) {
                    throw new Error(`DNS lookup failed with status ${response.status}`);
                }
                const result = await response.json();
                
                let isVerified = false;
                if (result.Status === 0 && result.Answer) {
                    const foundRecord = result.Answer.find((ans: any) => config.check(ans.data.replace(/"/g, '')));
                    if (foundRecord) {
                        isVerified = true;
                    }
                }
                setStatuses(prev => ({ ...prev, [key]: { status: isVerified ? 'verified' : 'failed' } }));

            } catch (error) {
                console.error(`Error checking ${key}:`, error);
                setStatuses(prev => ({ ...prev, [key]: { status: 'failed' } }));
            }
        }
        setIsChecking(false);
    };

    return (
        <div className="domain-verification-checker">
            <button className="btn check-all-btn" onClick={checkAllDns} disabled={isChecking}>
                {isChecking ? <Loader /> : <Icon path={ICONS.VERIFY} />}
                {isChecking ? t('checkingDns') : t('checkDnsStatus')}
            </button>
            <div className="dns-records-list">
                {Object.entries(DNS_RECORDS_CONFIG).map(([key, config]) => (
                    <div className="dns-record-item" key={key}>
                        <div className="dns-record-item-header">
                            <h4>{t('recordType', { type: key })}</h4>
                            <VerificationStatusIndicator status={statuses[key]?.status} />
                        </div>
                        <div className="dns-record-details">
                            <div className="detail"><strong>{t('host')}:</strong> <code>{config.host}</code></div>
                            <div className="detail"><strong>{t('type')}:</strong> <code>{config.type}</code></div>
                            <div className="detail"><strong>{t('value')}:</strong> <code>{config.expectedValue}</code></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DomainsView = ({ apiKey }: { apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const { addToast } = useToast();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const [newDomain, setNewDomain] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
    const [domainToDelete, setDomainToDelete] = useState<string | null>(null);
    const [domainToEdit, setDomainToEdit] = useState<any | null>(null);

    const { getStatusStyle } = useStatusStyles();

    const { data, loading, error } = useApiV4('/domains', apiKey, {}, refetchIndex);
    const refetch = () => {
        setExpandedDomain(null);
        setRefetchIndex(i => i + 1);
    }

    const handleNewDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
            .trim()
            .replace(/^(https?:\/\/)?(www\.)?/i, '')
            .split('/')[0];
        setNewDomain(value);
    };

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain) return;
        setIsSubmitting(true);
        try {
            await apiFetchV4('/domains', apiKey, { method: 'POST', body: { Domain: newDomain } });
            addToast(t('domainAddedSuccess', { domain: newDomain }), 'success');
            setNewDomain('');
            refetch();
        } catch (err: any) {
            addToast(t('domainAddedError', { error: err.message }), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const confirmDeleteDomain = async () => {
        if (!domainToDelete) return;
        try {
            await apiFetchV4(`/domains/${encodeURIComponent(domainToDelete)}`, apiKey, { method: 'DELETE' });
            addToast(t('domainDeletedSuccess', { domainName: domainToDelete }), 'success');
            refetch();
        } catch (err: any) {
            addToast(t('domainDeletedError', { error: err.message }), 'error');
        } finally {
            setDomainToDelete(null);
        }
    };
    
    const domainsList = Array.isArray(data) ? data : (data && Array.isArray(data.Data)) ? data.Data : [];
    const isNotFoundError = error && (error.message.includes('Not Found') || error.message.includes('not found'));
    const showNoDomainsMessage = !loading && !error && domainsList.length === 0;

    return (
        <div>
             <ConfirmModal
                isOpen={!!domainToDelete}
                onClose={() => setDomainToDelete(null)}
                onConfirm={confirmDeleteDomain}
                title={t('deleteDomain', { domainName: domainToDelete })}
            >
                <p>{t('confirmDeleteDomain', { domainName: domainToDelete })}</p>
            </ConfirmModal>
            {domainToEdit && (
                <SetDefaultSenderModal
                    isOpen={!!domainToEdit}
                    onClose={() => setDomainToEdit(null)}
                    domain={domainToEdit}
                    apiKey={apiKey}
                    onSuccess={() => {
                        setDomainToEdit(null);
                        refetch();
                    }}
                />
            )}
             <div className="view-header">
                <form className="add-domain-form" onSubmit={handleAddDomain}>
                    <input
                        type="text"
                        placeholder="example.com"
                        value={newDomain}
                        onChange={handleNewDomainChange}
                        disabled={isSubmitting}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!newDomain || isSubmitting}>
                        {isSubmitting ? <Loader /> : <><Icon path={ICONS.PLUS}/> {t('addDomain')}</>}
                    </button>
                </form>
            </div>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && !isNotFoundError && <ErrorMessage error={error} />}
            {showNoDomainsMessage && <CenteredMessage>{t('noDomainsFound')}</CenteredMessage>}
            
            {domainsList.length > 0 && 
            <div className="table-container">
                <table className="simple-table">
                    <thead>
                        <tr>
                            <th>{t('domains')}</th>
                            <th>{t('fromEmail')}</th>
                            <th>{t('status')}</th>
                            <th style={{ width: '1%', whiteSpace: 'nowrap', textAlign: i18n.dir() === 'rtl' ? 'left' : 'right' }}>{t('action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {domainsList.map((domain: any) => {
                             const domainName = domain.Domain || domain.domain;
                             if (!domainName) return null;

                             const defaultSender = domain.DefaultSender || domain.defaultsender;
                             
                             const getVerificationStyle = (isVerified: boolean) => isVerified ? getStatusStyle('Verified') : getStatusStyle('Missing');
                             
                             const isSpfVerified = String(domain.Spf || domain.spf).toLowerCase() === 'true';
                             const isDkimVerified = String(domain.Dkim || domain.dkim).toLowerCase() === 'true';
                             const isMxVerified = String(domain.MX || domain.mx).toLowerCase() === 'true';
                             const trackingStatus = domain.TrackingStatus || domain.trackingstatus;
                             const isTrackingVerified = String(trackingStatus).toLowerCase() === 'validated';
                             const isExpanded = expandedDomain === domainName;
                             
                             return (
                                <React.Fragment key={domainName}>
                                <tr>
                                    <td><strong>{domainName}</strong></td>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                            <span>{defaultSender || t('notSet', {defaultValue: 'Not Set'})}</span>
                                            <button className="btn-icon" onClick={() => setDomainToEdit(domain)}><Icon path={ICONS.PENCIL} /></button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="domain-status-pills">
                                            <Badge text="SPF" type={getVerificationStyle(isSpfVerified).type} />
                                            <Badge text="DKIM" type={getVerificationStyle(isDkimVerified).type} />
                                            <Badge text="Tracking" type={getVerificationStyle(isTrackingVerified).type} />
                                            <Badge text="MX" type={getVerificationStyle(isMxVerified).type} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button 
                                                className="btn btn-secondary" 
                                                onClick={() => setExpandedDomain(isExpanded ? null : domainName)}
                                                style={{ padding: '0.5rem 1rem' }}
                                            >
                                                <Icon path={isExpanded ? ICONS.CHEVRON_DOWN : ICONS.VERIFY} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                                                <span>{isExpanded ? t('cancel') : t('verify')}</span>
                                            </button>
                                            <button 
                                                className="btn-icon btn-icon-danger" 
                                                onClick={() => setDomainToDelete(domainName)} 
                                                aria-label={t('deleteDomain', { domainName })}
                                            >
                                                <Icon path={ICONS.DELETE} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: 0 }}>
                                            <DomainVerificationChecker domainName={domainName} />
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                             )
                        })}
                    </tbody>
                </table>
            </div>}
        </div>
    );
};

export default DomainsView;