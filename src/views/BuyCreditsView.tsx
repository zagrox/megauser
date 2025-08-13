

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
import sdk from '../api/directus';

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

const CreditSelector = ({ packages, onPurchase, isSubmitting }: { packages: any[], onPurchase: (pkg: any) => void, isSubmitting: boolean }) => {
    const { t, i18n } = useTranslation();
    const [selectedIndex, setSelectedIndex] = useState(Math.floor(packages.length / 4)); // Start somewhere in the lower-middle

    useEffect(() => {
        if (packages.length > 0 && selectedIndex >= packages.length) {
            setSelectedIndex(packages.length - 1);
        }
    }, [packages, selectedIndex]);

    if (packages.length === 0) {
        return null;
    }

    const selectedPackage = packages[selectedIndex];

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedIndex(parseInt(e.target.value, 10));
    };
    
    const handleSubmit = () => {
        onPurchase(selectedPackage);
    }

    return (
        <div className="card credit-selector-container">
            <div className="credit-selector-display">
                <div className="credit-amount-display">
                    <h2>{(selectedPackage.packsize || 0).toLocaleString(i18n.language)}</h2>
                    <span>{t('credits')}</span>
                </div>
                <div className="total-price-display">
                    <span>{(selectedPackage.packprice || 0).toLocaleString(i18n.language)} {t('priceIRT')}</span>
                </div>
            </div>

            <div className="credit-slider-wrapper">
                <input
                    type="range"
                    min="0"
                    max={packages.length - 1}
                    value={selectedIndex}
                    onChange={handleSliderChange}
                    className="credit-slider"
                    step="1"
                />
                <div className="credit-slider-labels">
                    {packages.map((pkg, index) => (
                        <span key={index} style={{
                            opacity: index === selectedIndex ? 1 : 0.6,
                            fontWeight: index === selectedIndex ? '700' : '400',
                        }}>
                            {pkg.packname}
                        </span>
                    ))}
                </div>
            </div>
            
            <div className="credit-selector-footer">
                <div className="price-per-credit">
                     <span>{t('pricePerCreditIRT')}:</span>
                     <strong>{selectedPackage.packrate}</strong>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader /> : t('order')}
                </button>
            </div>
        </div>
    );
};

const BalanceDisplayCard = ({ creditLoading, creditError, accountData, onHistoryClick }: { creditLoading: boolean, creditError: any, accountData: any, onHistoryClick: () => void }) => {
    const { t, i18n } = useTranslation();
    return (
        <div className="card balance-display-card">
            <div className="balance-info">
                <Icon path={ICONS.BUY_CREDITS} className="balance-icon" />
                <div>
                    <span className="balance-title">{t('yourCurrentBalance')}</span>
                    <span className="balance-amount">
                        {creditLoading ? <Loader /> : (creditError || accountData?.emailcredits === undefined) ? 'N/A' : Number(accountData.emailcredits).toLocaleString(i18n.language)}
                    </span>
                </div>
            </div>
            <button className="btn btn-secondary" onClick={onHistoryClick}>
                <Icon path={ICONS.CALENDAR} />
                <span>{t('viewHistory')}</span>
            </button>
        </div>
    );
};

const BuyCreditsView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t, i18n } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '' });
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [createdOrder, setCreatedOrder] = useState<any | null>(null);
    
    const [packages, setPackages] = useState<any[]>([]);
    const [packagesLoading, setPackagesLoading] = useState(true);
    const [packagesError, setPackagesError] = useState<string | null>(null);

    const { data: accountData, loading: creditLoading, error: creditError } = useApi('/account/load', apiKey, {}, apiKey ? 1 : 0);
    
    useEffect(() => {
        const fetchPackages = async () => {
            setPackagesLoading(true);
            setPackagesError(null);
            
            const url = `${DIRECTUS_CRM_URL}/items/packages?sort=packsize`;
    
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
    
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
                        throw new Error(`The server returned an unexpected JSON structure. Expected a 'data' array, but received:\n\n${JSON.stringify(result, null, 2)}`);
                    }
                } catch (jsonError) {
                    const bodyText = await responseCloneForText.text();
                    throw new Error(`Failed to parse the server's response as JSON. This often means the server sent an HTML error page instead of data.\n\nServer Response:\n${bodyText}`);
                }
            } catch (err: any) {
                setPackagesError(err.message);
                console.error("Failed to fetch credit packages:", err);
            } finally {
                setPackagesLoading(false);
            }
        };
    
        fetchPackages();
    }, [t, i18n.language]);


    const handlePurchase = async (pkg: any) => {
        if (!user || !user.id) {
            setModalState({
                isOpen: true,
                title: t('error'),
                message: t('userInfoUnavailable')
            });
            return;
        }

        setIsSubmitting(true);
        setModalState({ isOpen: false, title: '', message: '' });

        try {
            const token = await sdk.getToken();
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            const orderPayload = {
                status: "draft",
                user_created: user.id,
                order_total: pkg.packprice,
                project_name: "Mailzila",
                order_note: pkg.packname || `Package of ${pkg.packsize} credits`,
            };

            const response = await fetch(`${DIRECTUS_CRM_URL}/items/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData?.errors?.[0]?.message || 'Failed to create order.';
                throw new Error(errorMessage);
            }

            const newOrder = await response.json();
            setCreatedOrder(newOrder.data);

        } catch (error: any) {
            console.error('Order creation error:', error);
            setModalState({
                isOpen: true,
                title: t('purchaseFailed'),
                message: t('purchaseFailedMessage', { error: error.message })
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmAndPay = async () => {
        if (!createdOrder) return;

        setIsPaying(true);
        setModalState({ isOpen: false, title: '', message: '' });

        try {
            // Step 1: Request trackId from Zibal
            const zibalPayload = {
                merchant: "62f36ca618f934159dd26c19",
                amount: createdOrder.order_total,
                callbackUrl: "https://my.mailzila.com/callback.php",
                description: createdOrder.order_note,
                orderId: createdOrder.id,
            };

            const zibalResponse = await fetch("https://gateway.zibal.ir/v1/request", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(zibalPayload),
            });

            const zibalData = await zibalResponse.json();

            if (zibalData.result !== 100) {
                throw new Error(`ZibalPay Error: ${zibalData.message}`);
            }

            const trackId = zibalData.trackId;

            // Step 2: Create transaction record in Directus
            const token = await sdk.getToken();
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }
            
            const transactionPayload = {
                // The trackid from Zibal. Assuming the field in Directus is 'trackid'
                trackid: trackId,
                // The ID of the order we created. Assuming the relation field is 'order'
                order: createdOrder.id,
            };

            const directusResponse = await fetch(`${DIRECTUS_CRM_URL}/items/trackid`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionPayload),
            });

            if (!directusResponse.ok) {
                 const errorText = await directusResponse.text();
                 try {
                    const errorData = JSON.parse(errorText);
                    const errorMessage = errorData?.errors?.[0]?.message || 'Failed to create transaction record.';
                    throw new Error(errorMessage);
                 } catch (e) {
                    throw new Error(`Failed to create transaction record. Server responded with: ${errorText}`);
                 }
            }

            // Step 3: Redirect user to payment gateway
            window.location.href = `https://gateway.zibal.ir/start/${trackId}`;

        } catch (error: any) {
            console.error('Payment initiation error:', error);
            setModalState({
                isOpen: true,
                title: t('purchaseFailed'),
                message: error.message,
            });
            setIsPaying(false);
        }
    };
    
    const closeModal = () => setModalState({ isOpen: false, title: '', message: '' });

    if (createdOrder) {
        return (
            <div className="order-confirmation-view">
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <Icon path={ICONS.CHECK} style={{ width: 48, height: 48, color: 'var(--success-color)' }} />
                        <h2 style={{ marginTop: '1rem' }}>{t('orderSuccessMessage')}</h2>
                        <p>{t('orderSuccessSubtitle')}</p>
                    </div>
    
                    <h3>{t('orderDetails')}</h3>
                    <div className="table-container-simple" style={{ marginBottom: '2rem' }}>
                        <table className="simple-table">
                            <tbody>
                                <tr><td>{t('orderId')}</td><td style={{textAlign: 'right'}}><strong>#{createdOrder.id}</strong></td></tr>
                                <tr><td>{t('package')}</td><td style={{textAlign: 'right'}}><strong>{createdOrder.order_note}</strong></td></tr>
                                <tr><td>{t('total')}</td><td style={{textAlign: 'right'}}><strong>{Number(createdOrder.order_total).toLocaleString(i18n.language)} {t('priceIRT')}</strong></td></tr>
                            </tbody>
                        </table>
                    </div>
    
                    <h3>{t('paymentMethod')}</h3>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <select className="full-width">
                            <option>{t('paymentMethodBank')}</option>
                            <option>{t('paymentMethodCard')}</option>
                        </select>
                    </div>
                    
                    <div className="form-actions" style={{justifyContent: 'space-between', padding: 0}}>
                        <button className="btn btn-secondary" onClick={() => setCreatedOrder(null)} disabled={isPaying}>
                            <Icon path={ICONS.CHEVRON_LEFT} />
                            <span>{t('buyDifferentPackage')}</span>
                        </button>
                        <button className="btn btn-primary" onClick={handleConfirmAndPay} disabled={isPaying}>
                            {isPaying ? <Loader /> : <Icon path={ICONS.LOCK_OPEN} />}
                            <span>{t('confirmAndPay')}</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="buy-credits-view">
            <CreditHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} apiKey={apiKey} />
             <Modal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title}>
                <p style={{whiteSpace: "pre-wrap"}}>{modalState.message}</p>
            </Modal>

            <BalanceDisplayCard
                creditLoading={creditLoading}
                creditError={creditError}
                accountData={accountData}
                onHistoryClick={() => setIsHistoryOpen(true)}
            />
            
            <h3 className="content-title" style={{marginTop: '1.5rem'}}>{t('choosePackage')}</h3>
            
            {packagesLoading && <CenteredMessage><Loader/></CenteredMessage>}
            {packagesError && <ErrorMessage error={{endpoint: 'GET /items/packages', message: packagesError}} />}
            
            {!packagesLoading && !packagesError && (
                 <CreditSelector
                    packages={packages}
                    onPurchase={handlePurchase}
                    isSubmitting={isSubmitting}
                 />
            )}
        </div>
    );
};

export default BuyCreditsView;