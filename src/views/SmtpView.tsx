
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useApi from './useApi';
import { apiFetch } from '../api/elasticEmail';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import ActionStatus from '../components/ActionStatus';
import Modal from '../components/Modal';
import Icon, { ICONS } from '../components/Icon';

const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

const CopyButton = ({ value }: { value: string }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        copyToClipboard(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button onClick={handleCopy} className="btn-icon">
            <Icon path={copied ? ICONS.CHECK : ICONS.MAIL} />
        </button>
    );
};

const SecretValue = ({ value, type = "password" }: { value: string, type?: "text" | "password" }) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="secret-value-wrapper">
            <input type={isVisible ? 'text' : type} value={value} readOnly />
            <button type="button" className="btn-icon" onClick={() => setIsVisible(!isVisible)}>
                <Icon path={isVisible ? ICONS.EYE_OFF : ICONS.EYE} />
            </button>
            <CopyButton value={value} />
        </div>
    );
};


const AddCredentialModal = ({ isOpen, onClose, apiKey, onSuccess, onError }: { isOpen: boolean, onClose: () => void, apiKey: string, onSuccess: (data: any) => void, onError: (msg: string) => void }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            onError(t('credentialNameEmptyError'));
            return;
        }
        setIsSubmitting(true);
        try {
            const data = await apiFetch('/account/addadditionalcredential', apiKey, {
                method: 'POST',
                params: { credentialName: name, accessLevel: 'Smtp' }
            });
            onSuccess({ ...data, name });
            setName('');
        } catch (err: any) {
            onError(t('credentialCreateError'));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('addSmtpCredentialTitle')}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label htmlFor="cred-name">{t('credentialName')}</label>
                    <input id="cred-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('credentialNamePlaceholder')} required />
                    <small>{t('credentialNameSubtitle')}</small>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? <Loader /> : t('createCredential')}</button>
                </div>
            </form>
        </Modal>
    );
};

const NewCredentialInfoModal = ({ isOpen, onClose, credInfo }: { isOpen: boolean, onClose: () => void, credInfo: any | null }) => {
    const { t } = useTranslation();
    if (!credInfo) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('credentialCreatedSuccessTitle')}>
            <div className="new-api-key-display">
                <div className="info-message warning">{t('copyApiKeyNotice')}</div>
                <div className="form-group">
                    <label htmlFor="new-apikey">{t('apiKeyPassword')}</label>
                    <SecretValue value={credInfo.apikey} />
                </div>
                <div className="form-actions" style={{justifyContent: 'flex-end'}}>
                    <button type="button" className="btn btn-primary" onClick={onClose}>{t('done')}</button>
                </div>
            </div>
        </Modal>
    );
};

const SmtpView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t } = useTranslation();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCredInfo, setNewCredInfo] = useState<any | null>(null);

    const { data: mainCreds, loading, error } = useApi('/account/load', apiKey, {}, refetchIndex);
    const { data: addCreds, loading: addLoading, error: addError } = useApi('/account/loadadditionalcredentials', apiKey, {}, refetchIndex);
    
    const isAccessDenied = addError && addError.message.toLowerCase().includes('access denied');

    const refetch = () => setRefetchIndex(i => i + 1);

    const handleDeleteCredential = async (credName: string, apiKeyToDelete: string) => {
        if (!window.confirm(t('confirmDeleteCredential', { name: credName }))) return;
        try {
            await apiFetch('/account/deleteadditionalcredential', apiKey, { method: 'POST', params: { apikey: apiKeyToDelete } });
            setActionStatus({ type: 'success', message: t('credentialDeletedSuccess', { name: credName }) });
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('credentialDeletedError', { error: err.message }) });
        }
    };
    
    const handleCreateSuccess = (data: any) => {
        setIsAddModalOpen(false);
        setActionStatus({ type: 'success', message: t('credentialCreatedSuccess', { name: data.name }) });
        setNewCredInfo(data);
        refetch();
    };

    return (
        <div>
            <ActionStatus status={actionStatus} onDismiss={() => setActionStatus(null)} />
            <AddCredentialModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                apiKey={apiKey}
                onSuccess={handleCreateSuccess}
                onError={(msg) => setActionStatus({type: 'error', message: msg})}
            />
            <NewCredentialInfoModal 
                isOpen={!!newCredInfo}
                onClose={() => setNewCredInfo(null)}
                credInfo={newCredInfo}
            />

            <div className="card main-credential-card">
                <div className="card-header"><h3>{t('mainAccountCredentials')}</h3></div>
                <div className="card-body">
                    {loading && <CenteredMessage><Loader /></CenteredMessage>}
                    {error && <ErrorMessage error={error} />}
                    {mainCreds && (
                        <div className="smtp-card-body">
                            <div className="smtp-detail-item"><label>{t('server')}</label><strong>smtp.mailzila.com</strong></div>
                            <div className="smtp-detail-item"><label>{t('ports')}</label><strong>25, 2525, 587, 465</strong></div>
                            <div className="smtp-detail-item"><label>{t('username')}</label><strong className="monospace">{mainCreds.email}</strong></div>
                            <div className="smtp-detail-item full-span"><label>{t('passwordMainApiKey')}</label><SecretValue value={apiKey} /></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="view-header" style={{ marginTop: '2rem' }}>
                <h3>{t('additionalCredentials')}</h3>
                {!isAccessDenied && (
                    <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                        <Icon path={ICONS.PLUS} /> {t('addCredential')}
                    </button>
                )}
            </div>
            
            {addLoading && <CenteredMessage><Loader /></CenteredMessage>}
            {addError && (
                 isAccessDenied ? (
                    <div className="info-message warning">
                        <strong>{t('featureNotAvailableTitle')}</strong>
                        <p>{t('smtpFeatureNotAvailable')}</p>
                    </div>
                 ) : (
                    <ErrorMessage error={addError} />
                 )
            )}
            
            {!addError && !addLoading && (
                !addCreds || addCreds.length === 0 ? (
                    <CenteredMessage>{t('noAdditionalCredentials')}</CenteredMessage>
                ) : (
                    <div className="card-grid smtp-additional-grid">
                        {addCreds.map((cred: any) => (
                            <div key={cred.ApiKey} className="card smtp-additional-card">
                                <div className="card-header">
                                    <h4>{cred.CredentialName}</h4>
                                    <button className="btn-icon btn-icon-danger" onClick={() => handleDeleteCredential(cred.CredentialName, cred.ApiKey)}>
                                        <Icon path={ICONS.DELETE} />
                                    </button>
                                </div>
                                <div className="card-body">
                                    <div className="smtp-additional-detail"><label>{t('accessLevel')}:</label> <strong>{cred.AccessLevel}</strong></div>
                                    <div className="smtp-additional-detail"><label>{t('lastUsed')}:</label> <strong>{cred.LastUsed || 'N/A'}</strong></div>
                                    <div className="smtp-detail-item"><label>{t('apiKeyPassword')}</label><SecretValue value={cred.ApiKey} /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default SmtpView;