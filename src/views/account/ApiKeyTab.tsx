import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../api/elasticEmail';
import ActionStatus from '../../components/ActionStatus';
import Loader from '../../components/Loader';

const ApiKeyTab = ({ apiKey: initialApiKey }: { apiKey: string }) => {
    const { t } = useTranslation();
    const { updateUser } = useAuth();
    const [newApiKey, setNewApiKey] = useState(initialApiKey || '');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

    const handleSaveKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus(null);
        try {
            await apiFetch('/account/load', newApiKey);
            await updateUser({ panelkey: newApiKey });
            setStatus({ type: 'success', message: t('apiKeyUpdateSuccess') });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || t('apiKeyUpdateError') });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="account-tab-content">
            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>{t('apiKey')}</h3>
                </div>
                <form onSubmit={handleSaveKey}>
                    <div className="account-tab-card-body">
                         <div className="form-group">
                            <label htmlFor="api-key-input">{t('yourApiKey')}</label>
                            <input
                                id="api-key-input"
                                type="password"
                                value={newApiKey}
                                onChange={(e) => setNewApiKey(e.target.value)}
                                placeholder={t('enterYourApiKey')}
                                required
                            />
                        </div>
                        {status && <ActionStatus status={status} onDismiss={() => setStatus(null)}/>}
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? <Loader /> : t('saveAndVerifyKey')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApiKeyTab;