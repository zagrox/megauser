import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import ActionStatus from '../../components/ActionStatus';
import Loader from '../../components/Loader';

const SecurityTab = ({ isApiKeyUser }: { isApiKeyUser: boolean }) => {
    const { t } = useTranslation();
    const { changePassword } = useAuth();
    const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        const currentPassword = data.get('current_password') as string;
        const newPassword = data.get('new_password') as string;
        const confirmPassword = data.get('confirm_password') as string;
        
        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: t('passwordsDoNotMatch') });
            return;
        }

        if (!currentPassword || !newPassword) {
            return;
        }

        setIsSaving(true);
        try {
            await changePassword({
                old: currentPassword,
                new: newPassword
            });
            setStatus({ type: 'success', message: t('passwordUpdateSuccess') });
            form.reset();
        } catch (err: any) {
            let errorMessage = err.message;
            if (err.errors && err.errors[0]?.message) {
                 errorMessage = err.errors[0].message;
            }
            setStatus({ type: 'error', message: `${t('passwordUpdateError')} ${errorMessage}` });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="account-tab-content">
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