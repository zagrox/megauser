import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readItems, updateItem } from '@directus/sdk';
import sdk from '../api/directus';
import { apiFetch } from '../api/elasticEmail';
import { useAuth } from '../contexts/AuthContext';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import Icon, { ICONS } from '../components/Icon';

const CallbackView = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams(window.location.search);
                const trackId = params.get('trackId');
                const status = params.get('status');
                const success = params.get('success');
                const orderIdParam = params.get('orderId');

                if (!trackId || !status || !success || !orderIdParam) {
                    throw new Error('Missing callback parameters.');
                }

                // Find the transaction by trackId
                const { data: transactions } = await sdk.request(readItems('transactions', {
                    filter: { trackid: { _eq: trackId } },
                    fields: ['*', 'transaction_order.*'],
                    limit: 1
                }));

                if (!transactions || transactions.length === 0) {
                    throw new Error(`Transaction with Track ID ${trackId} not found.`);
                }
                
                const transaction = transactions[0];
                const order = transaction.transaction_order;
                
                // Update the transaction status
                await sdk.request(updateItem('transactions', transaction.id, { payment_status: status }));

                const isSuccess = success === '1' && status === '2';

                if (isSuccess) {
                    // Update order status
                    await sdk.request(updateItem('orders', order.id, { order_status: 'completed' }));
                    
                    // Find package to get credit amount
                    const { data: packages } = await sdk.request(readItems('packages', {
                        filter: { packname: { _eq: order.order_note } }
                    }));
                    
                    if (!packages || packages.length === 0) {
                        throw new Error(`Package details for "${order.order_note}" not found.`);
                    }
                    const packsize = packages[0].packsize;

                    // Add credits to user's account via Elastic Email API
                    if (user && user.panelkey) {
                        await apiFetch('/account/addsubaccountcredits', user.panelkey, {
                            method: 'POST',
                            params: {
                                credits: packsize,
                                notes: `Order #${order.id} via ZibalPay. Track ID: ${trackId}`
                            }
                        });
                        setMessage(`Payment successful! ${packsize.toLocaleString()} credits have been added to your account.`);
                    } else {
                        throw new Error("User authentication not found. Could not add credits.");
                    }
                } else {
                    // Payment failed or was canceled
                    await sdk.request(updateItem('orders', order.id, { order_status: 'failed' }));
                    throw new Error('Payment was not successful.');
                }

            } catch (err: any) {
                setError(err.message || 'An unknown error occurred during payment verification.');
            } finally {
                setLoading(false);
                setTimeout(() => {
                    window.location.href = '/'; // Redirect to dashboard
                }, 4000);
            }
        };

        handleCallback();
    }, [user, t]);

    if (loading) {
        return (
            <CenteredMessage style={{ height: '100vh' }}>
                <Loader />
                <p style={{ marginTop: '1rem', color: 'var(--subtle-text-color)' }}>
                    Verifying your payment, please wait...
                </p>
            </CenteredMessage>
        );
    }

    if (error) {
        return (
            <CenteredMessage style={{ height: '100vh', gap: '1rem' }}>
                <Icon path={ICONS.X_CIRCLE} style={{ width: 48, height: 48, color: 'var(--danger-color)'}} />
                <h3 style={{ color: 'var(--danger-color)' }}>Payment Failed</h3>
                <p style={{ color: 'var(--subtle-text-color)', maxWidth: '400px' }}>{error}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--subtle-text-color)' }}>You will be redirected shortly.</p>
            </CenteredMessage>
        );
    }

    return (
        <CenteredMessage style={{ height: '100vh', gap: '1rem' }}>
            <Icon path={ICONS.CHECK} style={{ width: 48, height: 48, color: 'var(--success-color)'}} />
            <h3 style={{ color: 'var(--success-color)' }}>Success!</h3>
            <p style={{ color: 'var(--subtle-text-color)', maxWidth: '400px' }}>{message}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--subtle-text-color)' }}>You will be redirected shortly.</p>
        </CenteredMessage>
    );
};

export default CallbackView;