
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useApi from './useApi';
import { formatDateForDisplay } from '../utils/helpers';
import Icon, { ICONS } from '../components/Icon';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import ErrorMessage from '../components/ErrorMessage';
import CenteredMessage from '../components/CenteredMessage';
import { DIRECTUS_CRM_URL } from '../api/config';


const PURCHASE_WEBHOOK_URL = 'https://mailzila.com/webhook-test/emailpack'; // As requested, URL is here for easy changes.

const CreditHistoryModal = ({ isOpen, onClose, apiKey }: { isOpen: boolean, onClose: () => void, apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const refetchIndex = isOpen ? 1 : 0;
    const { data: history, loading, error } = useApi('/account/loadsubaccountsemailcreditshistory', apiKey, {}, refetchIndex);
    
    const isAccessDenied = error && error.message.toLowerCase().includes('access denied');
    
    // The v2 API is inconsistent. This handles if the data is a direct array or nested in `historyitems`
    const historyItems = useMemo(() => {
        if (!history) return [];
        if (Array.isArray(history)) return history;
        if (history && Array.isArray(history.historyitems)) return history.historyitems;
        if (history && Array.isArray(history.HistoryItems)) return history.HistoryItems;
        return [];
    }, [history]);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('creditHistoryTitle')}>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && (
                isAccessDenied ? (
                    <div className="info-message warning" style={{maxWidth: 'none', alignItems: 'flex-start'}}>
                        <Icon path={ICONS.COMPLAINT} style={{flexShrink: 0, marginTop: '0.2rem'}} />
                        <div>
                            <strong>{t('featureNotAvailable')}</strong>
                            <p style={{color: 'var(--subtle-text-color)', margin: '0.25rem 0 0', padding: 0}}>
                                {t('creditHistoryNotAvailable')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <ErrorMessage error={error} />
                )
            )}
            {!loading && !error && (
                <div className="table-container">
                    <table className="credit-history-table">
                        <thead>
                            <tr>
                                <th>{t('date')}</th>
                                <th>{t('description')}</th>
                                <th style={{ textAlign: i18n.dir() === 'rtl' ? 'left' : 'right' }}>{t('amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyItems.length > 0 ? (
                                historyItems.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td>{formatDateForDisplay(item.Date || item.historydate, i18n.language)}</td>
                                        <td>{item.Notes || item.notes}</td>
                                        <td className="credit-history-amount">
                                            +{(item.Amount?.toLocaleString(i18n.language) ?? item.amount?.toLocaleString(i18n.language) ?? '0')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                                        {t('noCreditHistory')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
};


const BuyCreditsView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t, i18n } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
    const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '' });
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    const [packages, setPackages] = useState<any[]>([]);
    const [packagesLoading, setPackagesLoading] = useState(true);
    const [packagesError, setPackagesError] = useState<string | null>(null);

    const { data: accountData, loading: creditLoading, error: creditError } = useApi('/account/load', apiKey, {}, apiKey ? 1 : 0);
    
    useEffect(() => {
        const fetchPackages = async () => {
            setPackagesLoading(true);
            setPackagesError(null);
            
            const url = `${DIRECTUS_CRM_URL}/items/packages`;
    
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
    
                // Clone the response so we can read it twice (once as JSON, once as text if JSON fails)
                const responseCloneForText = response.clone();
    
                if (!response.ok) {
                    let bodyText = '';
                    try {
                        bodyText = await response.text();
                    } catch(e) {
                        bodyText = '(Could not read response body)';
                    }
                    throw new Error(`Server responded with an error: ${response.status} ${response.statusText}\n\nResponse body:\n${bodyText}`);
                }
    
                try {
                    const result = await response.json();
                    
                    if (result && Array.isArray(result.data)) {
                        setPackages(result.data);
                    } else {
                        // The response was valid JSON, but didn't have the expected structure.
                        // This might be a Directus error message (e.g. permissions error).
                        throw new Error(`The server returned an unexpected JSON structure. Expected a 'data' array, but received:\n\n${JSON.stringify(result, null, 2)}`);
                    }
                } catch (jsonError) {
                    // This block executes if response.json() fails, e.g., if the response is HTML instead of JSON.
                    const bodyText = await responseCloneForText.text();
                    throw new Error(`Failed to parse the server's response as JSON. This often means the server sent an HTML error page instead of data.\n\nServer Response:\n${bodyText}`);
                }
            } catch (err: any) {
                // This top-level catch handles both network errors ("Failed to fetch") and the errors thrown above.
                setPackagesError(err.message);
                console.error("Failed to fetch credit packages:", err);
            } finally {
                setPackagesLoading(false);
            }
        };
    
        fetchPackages();
    }, [t, i18n.language]);


    const handlePurchase = async (pkg: any) => {
        if (!user || !user.email) {
            setModalState({ isOpen: true, title: t('error'), message: t('userInfoUnavailable') });
            return;
        }

        setIsSubmitting(pkg.id);

        const params = new URLSearchParams({
            userapikey: apiKey,
            useremail: user.email,
            amount: pkg.packsize.toString(),
            totalprice: pkg.packprice.toString(),
        });
        
        const requestUrl = `${PURCHASE_WEBHOOK_URL}?${params.toString()}`;

        try {
            const response = await fetch(requestUrl, {
                method: 'GET',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Webhook failed with status: ${response.status}. ${errorText}`);
            }

            setModalState({
                isOpen: true,
                title: t('purchaseInitiated'),
                message: t('purchaseInitiatedMessage', { count: (pkg.packsize || 0).toLocaleString(i18n.language) })
            });

        } catch (error: any) {
            console.error('Purchase webhook error:', error);
            setModalState({
                isOpen: true,
                title: t('purchaseFailed'),
                message: t('purchaseFailedMessage', { error: error.message })
            });
        } finally {
            setIsSubmitting(null);
        }
    };
    
    const closeModal = () => setModalState({ isOpen: false, title: '', message: '' });

    return (
        <div className="buy-credits-view">
            <div className="account-card current-balance-card">
                <div className="card-icon-wrapper">
                    <Icon path={ICONS.BUY_CREDITS} />
                </div>
                <div className="card-details">
                    <div className="card-title">{t('yourCurrentBalance')}</div>
                    <div className="card-content">
                        {creditLoading ? <Loader /> : (creditError || accountData?.emailcredits === undefined) ? 'N/A' : Number(accountData.emailcredits).toLocaleString(i18n.language)}
                    </div>
                </div>
            </div>
            
            <div className="view-header">
                <h3>{t('choosePackage')}</h3>
                <button className="btn" onClick={() => setIsHistoryOpen(true)}>
                    <Icon path={ICONS.CALENDAR} />
                    {t('viewHistory')}
                </button>
            </div>
            <CreditHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} apiKey={apiKey} />

            <Modal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title}>
                <p style={{whiteSpace: "pre-wrap"}}>{modalState.message}</p>
                 {modalState.title === t('purchaseInitiated') && (
                    <small style={{display: 'block', marginTop: '1rem', color: 'var(--subtle-text-color)'}}>
                        {t('testEnvironmentNotice')}
                    </small>
                )}
            </Modal>
            
            {packagesLoading && <CenteredMessage><Loader/></CenteredMessage>}
            {packagesError && <ErrorMessage error={{endpoint: 'GET /items/packages', message: packagesError}} />}
            
            {!packagesLoading && !packagesError && (
                 <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>{t('package')}</th>
                                <th>{t('credits')}</th>
                                <th>{t('priceIRT')}</th>
                                <th>{t('pricePerCreditIRT')}</th>
                                <th style={{ textAlign: i18n.dir() === 'rtl' ? 'left' : 'right' }}>{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packages.map((pkg: any) => (
                                <tr key={pkg.id}>
                                    <td><strong>{pkg.packname}</strong></td>
                                    <td>{(pkg.packsize || 0).toLocaleString(i18n.language)}</td>
                                    <td>{(pkg.packprice || 0).toLocaleString(i18n.language)}</td>
                                    <td>{pkg.packrate}</td>
                                    <td style={{ textAlign: i18n.dir() === 'rtl' ? 'left' : 'right' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handlePurchase(pkg)}
                                            disabled={isSubmitting !== null}
                                            style={{ margin: 0 }}
                                        >
                                            {isSubmitting === pkg.id ? <Loader /> : t('order')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="webhook-info">
                <p>
                    <strong>{t('developerNote')}:</strong> {t('webhookInfoText')} <code>PURCHASE_WEBHOOK_URL</code> {t('inComponent')} <code>BuyCreditsView</code> {t('in')} <code>src/views/BuyCreditsView.tsx</code>.
                </p>
            </div>
        </div>
    );
};

export default BuyCreditsView;