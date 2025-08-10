import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import { apiFetchV4 } from '../api/elasticEmail';
import { Segment } from '../api/types';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import ActionStatus from '../components/ActionStatus';
import Modal from '../components/Modal';
import RenameModal from '../components/RenameModal';
import RuleBuilder from '../components/RuleBuilder';
import Icon, { ICONS } from '../components/Icon';

const CreateSegmentModal = ({ isOpen, onClose, apiKey, onSuccess, onError }: { isOpen: boolean, onClose: () => void, apiKey: string, onSuccess: Function, onError: Function }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [conjunction, setConjunction] = useState('AND');
    const [rules, setRules] = useState([{ Field: 'Email', Operator: 'CONTAINS', Value: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || rules.some(r => !r.Field || !r.Operator)) {
            onError(t('segmentRuleValidationError'));
            return;
        }

        setIsSubmitting(true);
        const ruleString = rules.map(r => `(${r.Field} ${r.Operator} ${r.Value})`).join(` ${conjunction} `);
        
        try {
            await apiFetchV4('/segments', apiKey, {
                method: 'POST',
                body: { Name: name, Rule: ruleString }
            });
            onSuccess(name);
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('createNewSegment')}>
            <form onSubmit={handleSubmit} className="rule-builder-form">
                <div className="info-message warning">{t('segmentRuleSubRuleNotice')}</div>
                <div className="form-group">
                    <label htmlFor="segment-name">{t('segmentName')}</label>
                    <input id="segment-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <RuleBuilder rules={rules} setRules={setRules} conjunction={conjunction} setConjunction={setConjunction} />
                <div className="form-actions">
                    <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? <Loader/> : t('createSegment')}</button>
                </div>
            </form>
        </Modal>
    );
};


const SegmentsView = ({ apiKey }: { apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [segmentToRename, setSegmentToRename] = useState<Segment | null>(null);

    const { data: segments, loading, error } = useApiV4('/segments', apiKey, {}, refetchIndex);
    const refetch = () => setRefetchIndex(i => i + 1);

    const handleCreateSuccess = (name: string) => {
        setIsCreateModalOpen(false);
        setActionStatus({ type: 'success', message: t('segmentCreatedSuccess', { name }) });
        refetch();
    };
    
    const handleDeleteSegment = async (segmentName: string) => {
        if (!window.confirm(t('confirmDeleteSegment', { segmentName }))) return;
        try {
            await apiFetchV4(`/segments/${encodeURIComponent(segmentName)}`, apiKey, { method: 'DELETE' });
            setActionStatus({ type: 'success', message: t('segmentDeletedSuccess', { segmentName }) });
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('segmentDeletedError', { error: err.message }) });
        }
    };

    const handleRenameSegment = async (newName: string) => {
        if (!segmentToRename) return;
        try {
            await apiFetchV4(`/segments/${encodeURIComponent(segmentToRename.Name)}`, apiKey, {
                method: 'PUT',
                body: { Name: newName }
            });
            setActionStatus({ type: 'success', message: t('segmentRenamedSuccess', { newName }) });
            setSegmentToRename(null);
            setTimeout(() => refetch(), 1000);
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('segmentRenamedError', { error: err.message }) });
        }
    };
    
    const filteredSegments: Segment[] = segments?.filter((seg: Segment) => 
        seg.Name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div>
            <ActionStatus status={actionStatus} onDismiss={() => setActionStatus(null)} />
            <CreateSegmentModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                apiKey={apiKey}
                onSuccess={handleCreateSuccess}
                onError={(msg: string) => setActionStatus({type: 'error', message: msg})}
            />
            {segmentToRename && (
                <RenameModal
                    isOpen={!!segmentToRename}
                    onClose={() => setSegmentToRename(null)}
                    entityName={segmentToRename.Name}
                    entityType={t('segment')}
                    onSubmit={handleRenameSegment}
                />
            )}
            
            <div className="view-header">
                 <div className="search-bar">
                    <Icon path={ICONS.SEARCH} />
                    <input type="search" placeholder={t('searchSegmentsPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Icon path={ICONS.PLUS} /> {t('createSegment')}
                </button>
            </div>

            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {!loading && filteredSegments.length === 0 && (
                 <CenteredMessage>
                    {searchQuery ? t('noSegmentsForQuery', { query: searchQuery }) : t('noSegmentsFound')}
                </CenteredMessage>
            )}

            <div className="card-grid">
                {filteredSegments.map((seg: Segment) => (
                    <div key={seg.Name} className="card segment-card">
                        <div className="segment-card-header">
                            <h3>{seg.Name}</h3>
                            <div className="action-buttons">
                                <button className="btn-icon" onClick={() => setSegmentToRename(seg)} aria-label={t('renameSegment')}><Icon path={ICONS.PENCIL}/></button>
                                <button className="btn-icon btn-icon-danger" onClick={() => handleDeleteSegment(seg.Name)} aria-label={t('deleteSegment')}><Icon path={ICONS.DELETE}/></button>
                            </div>
                        </div>
                        <div className="segment-card-body">
                             <p>{t('rule')}:</p>
                             <div className="segment-rule">{seg.Rule}</div>
                        </div>
                         <div className="segment-card-footer">
                            <span>{t('totalContacts')}: {(seg.ContactsCount || 0).toLocaleString(i18n.language)}</span>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SegmentsView;