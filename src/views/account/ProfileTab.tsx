
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateForDisplay } from '../../utils/helpers';
import Icon, { ICONS } from '../../components/Icon';
import { DIRECTUS_URL } from '../../api/config';
import Badge from '../../components/Badge';
import EditProfileModal from './EditProfileModal';

const ProfileField = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div className="form-group">
        <label>{label}</label>
        <div className="profile-field-value">{value || '—'}</div>
    </div>
);


const ProfileTab = ({ accountData, user }: { accountData: any, user: any }) => {
    const { t, i18n } = useTranslation();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!user) {
        return null; 
    }

    const firstName = user?.first_name || accountData?.firstname;
    const lastName = user?.last_name || accountData?.lastname;
    const email = user?.email || accountData?.email;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    
    const avatarUrl = user?.avatar ? `${DIRECTUS_URL}/assets/${user.avatar}` : null;

    const getRoleName = (role: any) => {
        if (typeof role === 'object' && role !== null && role.name) {
            return role.name;
        }
        return role; // Fallback for role ID or simple string
    }

    const getStatusType = (status: string | undefined) => {
        const lowerStatus = (status || '').toLowerCase();
        if (lowerStatus === 'active') return 'success';
        if (lowerStatus === 'archived' || lowerStatus === 'suspended') return 'danger';
        return 'default';
    }


    return (
        <div className="account-tab-content">
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
            />
            <div className="profile-hero">
                <div style={{display: 'flex', gap: '2rem', alignItems: 'center', flexGrow: 1}}>
                    <div className="profile-avatar">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={t('profile')} />
                        ) : (
                            <Icon path={ICONS.ACCOUNT} />
                        )}
                    </div>
                    <div className="profile-info">
                        <h3>{fullName || t('userProfile')}</h3>
                        <p className="profile-email">{email || 'N/A'}</p>
                        <div className="profile-meta">
                            {user.role && <Badge text={getRoleName(user.role)} type="info" />}
                            {user.status && <Badge text={user.status} type={getStatusType(user.status)} />}
                        </div>
                    </div>
                </div>
                <div className="profile-actions">
                    <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(true)}>
                        <Icon path={ICONS.PENCIL} />
                        <span>{t('editProfile')}</span>
                    </button>
                </div>
            </div>

            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>{t('personalInformation')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <div className="form-grid">
                        <ProfileField label={t('firstName')} value={user.first_name} />
                        <ProfileField label={t('lastName')} value={user.last_name} />
                        <ProfileField label={t('birthDate')} value={formatDateForDisplay(user.birthDate, i18n.language)} />
                        <ProfileField label={t('nationalCode')} value={user.nationalCode} />
                        <ProfileField label={t('location')} value={user.location} />
                    </div>
                </div>
            </div>

            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>{t('accountDetails')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <div className="form-grid">
                        <ProfileField label={t('directusId')} value={user.id} />
                        <ProfileField label={t('joinDate')} value={formatDateForDisplay(user.joindate, i18n.language)} />
                        <ProfileField label={t('lastAccess')} value={formatDateForDisplay(user.last_access, i18n.language)} />
                    </div>
                </div>
            </div>

            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>{t('preferences')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <div className="form-grid">
                        <ProfileField label={t('language')} value={user.language} />
                        <ProfileField label={t('textDirection')} value={user.text_direction} />
                        <ProfileField label={t('emailNotifications')} value={user.email_notifications ? t('yes') : t('no')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;
