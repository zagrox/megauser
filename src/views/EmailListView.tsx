import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import { apiFetchV4 } from '../api/elasticEmail';
import { List, Contact } from '../api/types';
import { formatDateForDisplay } from '../utils/helpers';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import ActionStatus from '../components/ActionStatus';
import Modal from '../components/Modal';
import RenameModal from '../components/RenameModal';
import Icon, { ICONS } from '../components/Icon';
import Badge from '../components/Badge';

const ListContactsModal = ({ isOpen, onClose, listName, apiKey }: { isOpen: boolean, onClose: () => void, listName: string, apiKey: string }) => {
    const { t } = useTranslation();
    const [offset, setOffset] = useState(0);
    const [refetchIndex, setRefetchIndex] = useState(0);
    const CONTACTS_PER_PAGE = 15;
    
    useEffect(() => {
        if (isOpen) {
            setOffset(0);
            setRefetchIndex(i => i + 1);
        }
    }, [isOpen]);

    const { data: contacts, loading, error } = useApiV4(
        isOpen ? `/lists/${encodeURIComponent(listName)}/contacts` : '', 
        apiKey, 
        { limit: CONTACTS_PER_PAGE, offset },
        refetchIndex
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('contactsInList', { listName })}>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {!loading && !error && (
                <>
                    <div className="table-container">
                        <table className="simple-table">
                            <thead>
                                <tr>
                                    <th>{t('email')}</th>
                                    <th>{t('name')}</th>
                                    <th>{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts && contacts.length > 0 ? (
                                    contacts.map((c: Contact) => (
                                        <tr key={c.Email}>
                                            <td>{c.Email}</td>
                                            <td>{`${c.FirstName || ''} ${c.LastName || ''}`.trim() || '-'}</td>
                                            <td><Badge text={c.Status} type={c.Status === 'Active' ? 'success' : 'default'} /></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>{t('listHasNoContacts')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {contacts && (contacts.length > 0 || offset > 0) && (
                         <div className="pagination-controls" style={{borderTop: 'none', marginTop: '1rem'}}>
                            <button onClick={() => setOffset(o => Math.max(0, o - CONTACTS_PER_PAGE))} disabled={offset === 0 || loading}>
                                {t('previous')}
                            </button>
                            <span>{t('page', { page: offset / CONTACTS_PER_PAGE + 1 })}</span>
                            <button onClick={() => setOffset(o => o + CONTACTS_PER_PAGE)} disabled={contacts.length < CONTACTS_PER_PAGE || loading}>
                                {t('next')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
};


const EmailListView = ({ apiKey }: { apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [newListName, setNewListName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [listToRename, setListToRename] = useState<List | null>(null);
    const [listToView, setListToView] = useState<List | null>(null);

    const { data: lists, loading, error } = useApiV4('/lists', apiKey, {}, refetchIndex);
    const refetch = () => setRefetchIndex(i => i + 1);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName) return;
        setIsSubmitting(true);
        try {
            await apiFetchV4('/lists', apiKey, { method: 'POST', body: { ListName: newListName } });
            setActionStatus({ type: 'success', message: t('listCreatedSuccess', { listName: newListName }) });
            setNewListName('');
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('listCreatedError', { error: err.message }) });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteList = async (listName: string) => {
        if (!window.confirm(t('confirmDeleteList', { listName }))) return;
        try {
            await apiFetchV4(`/lists/${encodeURIComponent(listName)}`, apiKey, { method: 'DELETE' });
            setActionStatus({ type: 'success', message: t('listDeletedSuccess', { listName }) });
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('listDeletedError', { error: err.message }) });
        }
    };

    const handleRenameList = async (newName: string) => {
        if (!listToRename) return;
        try {
            await apiFetchV4(`/lists/${encodeURIComponent(listToRename.ListName)}`, apiKey, {
                method: 'PUT',
                body: { ListName: newName }
            });
            setActionStatus({ type: 'success', message: t('listRenamedSuccess', { newName }) });
            setListToRename(null);
            setTimeout(() => refetch(), 1000); // Wait for API to propagate change
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('listRenamedError', { error: err.message }) });
        }
    };

    const filteredLists: List[] = (lists || [])
        .filter((list: List) => 
            list.ListName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => new Date(b.DateAdded).getTime() - new Date(a.DateAdded).getTime());

    return (
        <div>
            <ActionStatus status={actionStatus} onDismiss={() => setActionStatus(null)} />

            {listToRename && (
                <RenameModal 
                    isOpen={!!listToRename}
                    onClose={() => setListToRename(null)}
                    entityName={listToRename.ListName}
                    entityType={t('list')}
                    onSubmit={handleRenameList}
                />
            )}
            
            {listToView && (
                <ListContactsModal
                    isOpen={!!listToView}
                    onClose={() => setListToView(null)}
                    listName={listToView.ListName}
                    apiKey={apiKey}
                />
            )}


            <div className="view-header">
                 <div className="search-bar">
                    <Icon path={ICONS.SEARCH} />
                    <input
                        type="search"
                        placeholder={t('searchListsPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <form className="create-list-form" onSubmit={handleCreateList}>
                    <input
                        type="text"
                        placeholder={t('newListNamePlaceholder')}
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!newListName || isSubmitting}>
                        {isSubmitting ? <Loader /> : <><Icon path={ICONS.PLUS}/> {t('createList')}</>}
                    </button>
                </form>
            </div>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {!loading && filteredLists.length === 0 && (
                 <CenteredMessage>
                    {searchQuery ? t('noListsForQuery', { query: searchQuery }) : t('noListsFound')}
                </CenteredMessage>
            )}
            <div className="card-grid list-grid">
                {filteredLists.map((list: List) => (
                    <div key={list.ListName} className="card list-card">
                        <div className="list-card-header">
                            <h3>{list.ListName}</h3>
                        </div>
                        <div className="list-card-body">
                             <p>{t('dateAdded')}: {formatDateForDisplay(list.DateAdded, i18n.language)}</p>
                        </div>
                        <div className="list-card-footer">
                           <div className="action-buttons">
                                <button className="btn-icon" onClick={() => setListToRename(list)} aria-label={t('renameList')}>
                                    <Icon path={ICONS.PENCIL} />
                                </button>
                                <button className="btn-icon" onClick={() => setListToView(list)} aria-label={t('viewContactsInList')}>
                                    <Icon path={ICONS.CONTACTS} />
                                </button>
                                <button className="btn-icon btn-icon-danger" onClick={() => handleDeleteList(list.ListName)} aria-label={t('deleteList')}>
                                    <Icon path={ICONS.DELETE} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmailListView;