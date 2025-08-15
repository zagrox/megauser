import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Loader from '../../components/Loader';
import { readItems } from '@directus/sdk';
import sdk from '../../api/directus';
import { formatDateRelative } from '../../utils/helpers';
import Icon, { ICONS } from '../../components/Icon';
import CenteredMessage from '../../components/CenteredMessage';
import ErrorMessage from '../../components/ErrorMessage';

const SecurityTab = ({ user }: { user: any }) => {
    const { t, i18n } = useTranslation();
    const { changePassword } = useAuth();
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [activities, setActivities] = useState<any[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [activityError, setActivityError] = useState<any>(null);

    const isApiKeyUser = user?.isApiKeyUser;

    useEffect(() => {
        if (isApiKeyUser || !user?.id) {
            setActivityLoading(false);
            return;
        }

        const fetchActivity = async () => {
            setActivityLoading(true);
            try {
                const response = await sdk.request(readItems('directus_activity', {
                    filter: { user: { _eq: user.id } },
                    sort: ['-timestamp'],
                    limit: 10,
                }));
                setActivities(response);
            } catch (err: any) {
                setActivityError({ message: err.message || 'Failed to fetch activity log', endpoint: '/activity' });
            } finally {
                setActivityLoading(false);
            }
        };

        fetchActivity();
    }, [user, isApiKeyUser]);
    
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        const currentPassword = data.get('current_password') as string;
        const newPassword = data.get('new_password') as string;
        const confirmPassword = data.get('confirm_password') as string;
        
        if (newPassword !== confirmPassword) {
            addToast(t('passwordsDoNotMatch'), 'error');
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
            addToast(t('passwordUpdateSuccess'), 'success');
            form.reset();
        } catch (err: any) {
            let errorMessage = err.message;
            if (err.errors && err.errors[0]?.message) {
                 errorMessage = err.errors[0].message;
            }
            addToast(`${t('passwordUpdateError')} ${errorMessage}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const getActivityDetails = (activity: any) => {
        let icon = ICONS.SETTINGS;
        let description = `Action: ${activity.action}`;

        switch (activity.action) {
            case 'login':
                icon = ICONS.KEY;
                description = `Logged in`;
                break;
            case 'logout':
                icon = ICONS.LOGOUT;
                description = `Logged out`;
                break;
            case 'update':
                icon = ICONS.PENCIL;
                description = `Updated item #${activity.item} in "${activity.collection}"`;
                break;
            case 'create':
                icon = ICONS.PLUS;
                description = `Created item in "${activity.collection}"`;
                break;
            case 'delete':
                icon = ICONS.DELETE;
                description = `Deleted item #${activity.item} from "${activity.collection}"`;
                break;
            default:
                description = `Performed action: "${activity.action}"`;
        }
        return { icon, description };
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
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                {isSaving ? <Loader /> : t('changePassword')}
                            </button>
                        </div>
                    </fieldset>
                </form>
            </div>
            
            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>Activity Log</h3>
                </div>
                <div className="account-tab-card-body" style={{ padding: '0 1.5rem 1.5rem' }}>
                    {isApiKeyUser ? (
                        <CenteredMessage><p>Activity log is not available for API key users.</p></CenteredMessage>
                    ) : activityLoading ? (
                        <CenteredMessage><Loader /></CenteredMessage>
                    ) : activityError ? (
                        <ErrorMessage error={activityError} />
                    ) : activities.length === 0 ? (
                        <CenteredMessage><p>No recent activity found.</p></CenteredMessage>
                    ) : (
                        <ul className="activity-log-list">
                            {activities.map(activity => {
                                const { icon, description } = getActivityDetails(activity);
                                return (
                                    <li key={activity.id} className="activity-log-item">
                                        <div className="activity-log-icon"><Icon path={icon} /></div>
                                        <div className="activity-log-details">
                                            <div className="activity-log-description">{description}</div>
                                            <div className="activity-log-meta">
                                                {formatDateRelative(activity.timestamp, i18n.language)} • IP: {activity.ip}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityTab;
