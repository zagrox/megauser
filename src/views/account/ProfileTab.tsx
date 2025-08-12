import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateForDisplay } from '../../utils/helpers';
import Icon, { ICONS } from '../../components/Icon';

const ProfileField = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="form-group">
        <label>{label}</label>
        <div className="profile-field-value">{value || '—'}</div>
    </div>
);


const ProfileTab = ({ accountData, user }: { accountData: any, user: any }) => {
    const { t, i18n } = useTranslation();

    // The user object from AuthContext (Directus) is the primary source of truth.
    // accountData from Elastic Email API is used as a fallback.
    if (!user) {
        return null; // Should not happen if behind auth wall but good practice
    }

    const firstName = user?.first_name || accountData?.firstname;
    const lastName = user?.last_name || accountData?.lastname;
    const email = user?.email || accountData?.email;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    const publicId = user?.id || accountData?.publicaccountid;
    const dateJoined = user?.date_created || accountData?.datecreated;
    const lastActivity = user?.last_access || accountData?.lastactivity;

    // For the new fields, as per request, they are null for now.
    // They can be connected to Directus user fields like user.phone, user.company etc. later.
    const profileData = {
        firstName: firstName || null,
        lastName: lastName || null,
        phone: user?.phone || null,
        company: user?.company || null,
        address1: user?.address1 || null,
        city: user?.city || null,
        state: user?.state || null,
        zip: user?.zip || null,
        country: user?.country || null,
    };

    return (
        <div className="account-tab-content">
            <div className="profile-hero">
                <div className="profile-avatar">
                    <Icon path={ICONS.ACCOUNT} />
                </div>
                <div className="profile-info">
                    <h3>{fullName || t('userProfile')}</h3>
                    <p className="profile-email">{email || 'N/A'}</p>
                    <div className="profile-meta">
                        <div className="meta-item">
                            <label>{t('joined')}</label>
                            <span>{formatDateForDisplay(dateJoined, i18n.language)}</span>
                        </div>
                        <div className="meta-item">
                            <label>{t('lastActivity')}</label>
                            <span>{formatDateForDisplay(lastActivity, i18n.language)}</span>
                        </div>
                        <div className="meta-item">
                            <label>{t('publicId')}</label>
                            <span>{publicId || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>{t('personalInformation')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <div className="form-grid">
                        <ProfileField label={t('firstName')} value={profileData.firstName} />
                        <ProfileField label={t('lastName')} value={profileData.lastName} />
                        <ProfileField label={t('segmentField_Phone')} value={profileData.phone} />
                        <ProfileField label={t('segmentField_Company')} value={profileData.company} />
                    </div>
                </div>
            </div>
            
            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>{t('addressInformation')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <div className="form-grid">
                        <div className="full-width">
                            <ProfileField label={t('addressLine1')} value={profileData.address1} />
                        </div>
                        <ProfileField label={t('city')} value={profileData.city} />
                        <ProfileField label={t('stateProvince')} value={profileData.state} />
                        <ProfileField label={t('zipPostalCode')} value={profileData.zip} />
                        <ProfileField label={t('segmentField_Country')} value={profileData.country} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;
