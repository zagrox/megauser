import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetchV4 } from '../api/elasticEmail';
import useApiV4 from '../hooks/useApiV4';
import ActionStatus from '../components/ActionStatus';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { ICONS } from '../components/Icon';

const SendEmailView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t } = useTranslation();
    const { data: domains, loading: domainsLoading } = useApiV4('/domains', apiKey);
    const { data: lists, loading: listsLoading } = useApiV4('/lists', apiKey);
    const { data: segments, loading: segmentsLoading } = useApiV4('/segments', apiKey);

    const [subject, setSubject] = useState('');
    const [fromEmailLocalPart, setFromEmailLocalPart] = useState('');
    const [fromEmailDomainPart, setFromEmailDomainPart] = useState('');
    const [fromName, setFromName] = useState(user.first_name || '');
    const [sendTo, setSendTo] = useState('all'); // 'all', 'list', 'segment'
    const [listName, setListName] = useState('');
    const [segmentName, setSegmentName] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const verifiedDomains = useMemo(() => {
        if (!Array.isArray(domains)) return [];
        return domains
            .filter(d => 
                String(d.Spf).toLowerCase() === 'true' && 
                String(d.Dkim).toLowerCase() === 'true'
            )
            .map(d => d.Domain);
    }, [domains]);

    useEffect(() => {
        if (user?.email) {
            const [initialLocal, initialDomain] = user.email.split('@');
            setFromEmailLocalPart(initialLocal || 'info');

            if (verifiedDomains.length > 0) {
                if (initialDomain && verifiedDomains.includes(initialDomain)) {
                    setFromEmailDomainPart(initialDomain);
                } else {
                    setFromEmailDomainPart(verifiedDomains[0]);
                }
            } else {
                setFromEmailDomainPart('');
            }
        }
    }, [user.email, verifiedDomains]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        setSendStatus(null);
        
        if (!fromEmailDomainPart || verifiedDomains.length === 0) {
            setSendStatus({ type: 'error', message: t('noVerifiedDomains') });
            setIsSending(false);
            return;
        }
        
        const fullFromEmail = `${fromEmailLocalPart}@${fromEmailDomainPart}`;

        const emailContent = {
            From: fullFromEmail,
            Subject: subject,
            Body: [{ ContentType: 'HTML', Content: bodyHtml, Charset: 'utf-8' }],
        };
        
        let recipientPayload: any;
        if (sendTo === 'all') {
            recipientPayload = {
                Recipient: {
                    AllContacts: true
                }
            };
        } else if (sendTo === 'list' && listName) {
            recipientPayload = {
                 Recipient: {
                    ListNames: [listName]
                }
            };
        } else if (sendTo === 'segment' && segmentName) {
            recipientPayload = {
                 Recipient: {
                    SegmentNames: [segmentName]
                }
            };
        } else {
             setSendStatus({ type: 'error', message: 'Please select a valid recipient group.' });
             setIsSending(false);
             return;
        }

        try {
            await apiFetchV4('/emails/transactional', apiKey, {
                method: 'POST',
                body: {
                    ...recipientPayload,
                    Content: emailContent
                }
            });
            setSendStatus({ type: 'success', message: t('emailSentSuccess') });
            // Reset form
            setSubject('');
            setBodyHtml('');
        } catch (err: any) {
            setSendStatus({ type: 'error', message: t('emailSentError', { error: err.message }) });
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <div className="card form-container">
            <form onSubmit={handleSubmit} className="card-body form-grid">

                {/* --- Sender Info --- */}
                <div className="form-group full-width">
                    <label htmlFor="from-name">{t('fromName')}</label>
                    <input id="from-name" type="text" value={fromName} onChange={e => setFromName(e.target.value)} />
                </div>
                <div className="form-group full-width">
                    <label htmlFor="from-email-local">{t('fromEmail')}</label>
                    <div className="from-email-composer">
                        <input
                            id="from-email-local"
                            type="text"
                            value={fromEmailLocalPart}
                            onChange={e => setFromEmailLocalPart(e.target.value.replace(/@/g, ''))}
                            required
                            placeholder="newsletter"
                        />
                        <span className="from-email-at">@</span>
                        <select
                            value={fromEmailDomainPart}
                            onChange={e => setFromEmailDomainPart(e.target.value)}
                            required
                            disabled={domainsLoading || verifiedDomains.length === 0}
                        >
                            {domainsLoading && <option value="">{t('loading')}...</option>}
                            {!domainsLoading && verifiedDomains.length === 0 && <option value="">{t('noVerifiedDomains')}</option>}
                            {verifiedDomains.map(domain => (
                                <option key={domain} value={domain}>{domain}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <hr className="form-separator" />

                {/* --- Campaign Info --- */}
                <div className="form-group full-width">
                    <label htmlFor="subject">{t('subject')}</label>
                    <input id="subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} required />
                </div>
                <div className="form-group full-width">
                    <label>{t('sendTo')}</label>
                     <select value={sendTo} onChange={e => setSendTo(e.target.value)}>
                        <option value="all">{t('allContacts')}</option>
                        <option value="list">{t('aList')}</option>
                        <option value="segment">{t('aSegment')}</option>
                    </select>
                </div>
                {(sendTo === 'list' || sendTo === 'segment') && (
                    <div className="form-group full-width">
                    {sendTo === 'list' && (
                        <>
                            <label htmlFor="list-select">{t('selectList')}</label>
                            <select id="list-select" value={listName} onChange={e => setListName(e.target.value)} required disabled={listsLoading}>
                                <option value="">{t('chooseList')}</option>
                                {lists?.map((l: any) => <option key={l.ListName} value={l.ListName}>{l.ListName}</option>)}
                            </select>
                        </>
                    )}
                    {sendTo === 'segment' && (
                         <>
                            <label htmlFor="segment-select">{t('selectSegment')}</label>
                            <select id="segment-select" value={segmentName} onChange={e => setSegmentName(e.target.value)} required disabled={segmentsLoading}>
                                <option value="">{t('chooseSegment')}</option>
                                 {segments?.map((s: any) => <option key={s.Name} value={s.Name}>{s.Name}</option>)}
                            </select>
                        </>
                    )}
                    </div>
                )}
                
                <hr className="form-separator" />

                {/* --- Email Content --- */}
                <div className="form-group full-width">
                    <label htmlFor="body-html">{t('emailBodyHtml')}</label>
                    <textarea id="body-html" value={bodyHtml} onChange={e => setBodyHtml(e.target.value)} required></textarea>
                </div>
                
                <div className="form-actions">
                    {sendStatus && <span className={`send-status-message ${sendStatus.type}`}>{sendStatus.message}</span>}
                     <button type="submit" className="btn btn-primary" disabled={isSending}>
                        {isSending ? <Loader /> : <><Icon path={ICONS.SEND_EMAIL} /> {t('sendEmail')}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SendEmailView;