import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActionStatus from '../../components/ActionStatus';
import Loader from '../../components/Loader';
import Icon, { ICONS } from '../../components/Icon';

const CopyButton = ({ value }: { value: string }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button type="button" onClick={handleCopy} className="btn-icon" aria-label={t('copy')}>
            <Icon path={copied ? ICONS.CHECK : ICONS.MAIL} />
        </button>
    );
};

const SecurityTab = ({ apiKey, isApiKeyUser }: { apiKey: string, isApiKeyUser: boolean }) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Placeholder for password change logic
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        const newPassword = data.get('new_password');
        const confirmPassword = data.get('confirm_password');
        
        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: t('passwordsDoNotMatch') });
            return;
        }

        setIsSaving(true);
        // This is a placeholder. A real implementation would call an auth SDK method.
        // e.g., await auth.changePassword(data.get('current_password'), newPassword);
        setTimeout(() => {
            // Simulate an error for demonstration, as the backend logic is not connected.
            setStatus({ type: 'error', message: t('passwordUpdateError') });
            // On success, you would use:
            // setStatus({ type: 'success', message: t('passwordUpdateSuccess') });
            setIsSaving(false);
            form.reset();
        }, 1000);
    };

    return (
        <div className="account-tab-content">
            <div className="account-tab-card">
                 <div className="account-tab-card-header">
                    <h3>{t('apiKey')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <div className="form-group">
                        <label htmlFor="current-api-key">{t('yourApiKey')}</label>
                        <div className="secret-value-wrapper">
                             <input id="current-api-key" type="password" readOnly value={apiKey} />
                             <CopyButton value={apiKey} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="account-tab-card">
                 <div className="account-tab-card-header">
                    <h3>{t('changePassword')}</h3>
                </div>
                 <form onSubmit={handlePasswordChange}>
                    <fieldset disabled={isApiKeyUser} style={{border: 'none', padding: 0}}>
                        <div className="account-tab-card-body">
                            <p>{t('changePasswordSubtitle')}</p>
                            {isApiKeyUser && (
                                <div className="info-message warning">
                                    <p>{t('apiKeySignInMessage')}</p>
                                </div>
                            )}
                            <div className="form-group">
                                <label htmlFor="current_password">{t('currentPassword')}</label>
                                <input id="current_password" name="current_password" type="password" required />
                            </div>
                             <div className="form-group">
                                <label htmlFor="new_password">{t('newPassword')}</label>
                                <input id="new_password" name="new_password" type="password" required />
                            </div>
                             <div className="form-group">
                                <label htmlFor="confirm_password">{t('confirmPassword')}</label>
                                <input id="confirm_password" name="confirm_password" type="password" required />
                            </div>
                            {status && <ActionStatus status={status} onDismiss={() => setStatus(null)} />}
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                {isSaving ? <Loader /> : t('changePassword')}
                            </button>
                        </div>
                    </fieldset>
                </form>
            </div>
        </div>
    );
};

export default SecurityTab;
