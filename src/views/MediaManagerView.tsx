import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import { apiUploadV4, apiFetchV4 } from '../api/elasticEmail';
import { ELASTIC_EMAIL_API_V4_BASE } from '../api/config';
import { FileInfo } from '../api/types';
import { formatDateForDisplay, formatBytes } from '../utils/helpers';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import ActionStatus from '../components/ActionStatus';
import Modal from '../components/Modal';
import Icon, { ICONS } from '../components/Icon';
import ConfirmModal from '../components/ConfirmModal';

const FileUploadModal = ({ isOpen, onClose, apiKey, onSuccess, onError }: { isOpen: boolean; onClose: () => void; apiKey: string; onSuccess: (fileInfo: FileInfo) => void; onError: (msg: string) => void; }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [expiresAfterDays, setExpiresAfterDays] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleFileChange = (files: FileList | null) => {
        if (files && files.length > 0) {
            setFile(files[0]);
        }
    };

    const handleDragEvents = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragEnter = (e: React.DragEvent) => { handleDragEvents(e); setDragOver(true); };
    const handleDragLeave = (e: React.DragEvent) => { handleDragEvents(e); setDragOver(false); };
    const handleDrop = (e: React.DragEvent) => {
        handleDragEvents(e);
        setDragOver(false);
        handleFileChange(e.dataTransfer.files);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (expiresAfterDays) {
            formData.append('expiresAfterDays', expiresAfterDays);
        }

        try {
            const fileInfo = await apiUploadV4('/files', apiKey, formData);
            onSuccess(fileInfo);
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsUploading(false);
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setExpiresAfterDays('');
            setIsUploading(false);
            setDragOver(false);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('uploadModalTitle')}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label>{t('file')}</label>
                    <div
                        className={`file-dropzone ${dragOver ? 'drag-over' : ''}`}
                        onClick={() => document.getElementById('file-upload-input')?.click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragEvents}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file" id="file-upload-input"
                            onChange={(e) => handleFileChange(e.target.files)}
                            style={{ display: 'none' }}
                        />
                         {file ? (
                            <p className="file-name">{t('selectedFile', { fileName: file.name })}</p>
                        ) : (
                            <p><strong>{t('clickToBrowse')}</strong> {t('orDragAndDrop')}</p>
                        )}
                    </div>
                </div>

                <div className="form-group">
                     <label htmlFor="expiresAfterDays">{t('expiresAfterDays')}</label>
                     <input type="number" id="expiresAfterDays" value={expiresAfterDays} onChange={e => setExpiresAfterDays(e.target.value)} placeholder={t('leaveEmptyNoExpiry')} min="1" />
                </div>
                <div className="form-actions" style={{marginTop: '1rem'}}>
                     <button type="submit" className="btn btn-primary full-width" disabled={!file || isUploading}>
                        {isUploading ? <Loader /> : t('uploadFile')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const FilePreviewModal = ({ isOpen, onClose, fileInfo, apiKey }: { isOpen: boolean; onClose: () => void; fileInfo: FileInfo | null; apiKey: string; }) => {
    const { t } = useTranslation();
    const [contentUrl, setContentUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && fileInfo) {
            const fileName = fileInfo.FileName;
            const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(fileName);
            
            if (!isImage) {
                setContentUrl(null);
                return;
            }

            if (fileInfo.Size > 10 * 1024 * 1024) { // 10MB
                setError(t('fileIsTooLargeToPreview'));
                return;
            }

            let isCancelled = false;
            const fetchContent = async () => {
                setIsLoading(true);
                setError(null);
                setContentUrl(null);
                try {
                    const url = `${ELASTIC_EMAIL_API_V4_BASE}/files/${encodeURIComponent(fileName)}`;
                    const response = await fetch(url, { headers: { 'X-ElasticEmail-ApiKey': apiKey }});
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const blob = await response.blob();
                    if (!isCancelled) {
                        setContentUrl(URL.createObjectURL(blob));
                    }
                } catch (err: any) {
                    console.error("Failed to load file preview:", err);
                    if (!isCancelled) setError(t('couldNotLoadPreview'));
                } finally {
                    if (!isCancelled) setIsLoading(false);
                }
            };
            
            fetchContent();

            return () => {
                isCancelled = true;
                if (contentUrl) {
                    URL.revokeObjectURL(contentUrl);
                }
            };
        }
    }, [isOpen, fileInfo, apiKey, t]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('fileDetails')}>
            {fileInfo && (
                <div className="file-preview-container">
                    {isLoading && <CenteredMessage><Loader /></CenteredMessage>}
                    {error && <div className="info-message warning">{error}</div>}
                    {contentUrl ? (
                        <img src={contentUrl} alt={t('preview')} className="file-preview-image" />
                    ) : (
                         !isLoading && !error && <div className="info-message">{t('preview')}</div>
                    )}
                    <dl className="file-details-grid" style={{gap: '0.5rem 1rem', marginTop: '1.5rem'}}>
                        <dt>{t('fileName')}</dt><dd>{fileInfo.FileName}</dd>
                        <dt>{t('size')}</dt><dd>{formatBytes(fileInfo.Size)}</dd>
                        <dt>{t('dateAdded')}</dt><dd>{formatDateForDisplay(fileInfo.DateAdded)}</dd>
                        <dt>{t('expires')}</dt><dd>{fileInfo.ExpiresAfterDays ? `${fileInfo.ExpiresAfterDays} ${t('days')}` : 'Never'}</dd>
                    </dl>
                </div>
            )}
        </Modal>
    );
};

const FileCard = React.memo(({ fileInfo, apiKey, onView, onDelete }: { fileInfo: FileInfo, apiKey: string, onView: (file: FileInfo) => void, onDelete: (fileName: string) => void }) => {
    const { t } = useTranslation();
    const downloadUrl = `${ELASTIC_EMAIL_API_V4_BASE}/files/${encodeURIComponent(fileInfo.FileName)}?apiKey=${apiKey}`;
    const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(fileInfo.FileName);

    return (
        <div className="card file-card">
            <div className="file-card-icon-wrapper" onClick={() => onView(fileInfo)}>
                {isImage ? (
                    <img src={downloadUrl} alt={fileInfo.FileName} className="file-card-thumbnail" loading="lazy" />
                ) : (
                    <div className="file-card-icon-placeholder">
                        <Icon path={ICONS.FILE_TEXT} className="file-card-icon" />
                    </div>
                )}
            </div>
            <div className="file-card-info">
                <h4 className="file-card-name" title={fileInfo.FileName}>{fileInfo.FileName}</h4>
                <p className="file-card-meta">{formatBytes(fileInfo.Size)} &bull; {formatDateForDisplay(fileInfo.DateAdded)}</p>
            </div>
            <div className="file-card-actions">
                 <button className="btn-icon" onClick={() => onView(fileInfo)} aria-label={t('viewFileDetails')}>
                    <Icon path={ICONS.EYE} />
                </button>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" aria-label={t('downloadFile')}>
                    <Icon path={ICONS.DOWNLOAD} />
                </a>
                <button className="btn-icon btn-icon-danger" onClick={() => onDelete(fileInfo.FileName)} aria-label={t('deleteFile')}>
                    <Icon path={ICONS.DELETE} />
                </button>
            </div>
        </div>
    );
});

const FileGridCard = React.memo(({ fileInfo, apiKey, onView, onDelete }: { fileInfo: FileInfo, apiKey: string, onView: (file: FileInfo) => void, onDelete: (fileName: string) => void }) => {
    const { t } = useTranslation();
    const downloadUrl = `${ELASTIC_EMAIL_API_V4_BASE}/files/${encodeURIComponent(fileInfo.FileName)}?apiKey=${apiKey}`;
    const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(fileInfo.FileName);

    return (
        <div className="card file-grid-card" onClick={() => onView(fileInfo)}>
            <div className="file-grid-card-preview">
                {isImage ? (
                    <img src={downloadUrl} alt={fileInfo.FileName} className="file-grid-card-thumbnail" loading="lazy" />
                ) : (
                    <div className="file-grid-card-placeholder">
                        <Icon path={ICONS.FILE_TEXT} />
                    </div>
                )}
            </div>
            <div className="file-grid-card-overlay" onClick={(e) => e.stopPropagation()}>
                <div className="file-grid-card-actions">
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" aria-label={t('downloadFile')}>
                        <Icon path={ICONS.DOWNLOAD} />
                    </a>
                    <button className="btn-icon btn-icon-danger" onClick={() => onDelete(fileInfo.FileName)} aria-label={t('deleteFile')}>
                        <Icon path={ICONS.DELETE} />
                    </button>
                </div>
            </div>
            <div className="file-grid-card-info">
                <h4 className="file-grid-card-name" title={fileInfo.FileName}>{fileInfo.FileName}</h4>
                <p className="file-grid-card-meta">{formatBytes(fileInfo.Size)}</p>
            </div>
        </div>
    );
});


const MediaManagerView = ({ apiKey }: { apiKey: string }) => {
    const { t } = useTranslation();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const { data: files, loading, error } = useApiV4('/files', apiKey, {}, refetchIndex);
    const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [fileToPreview, setFileToPreview] = useState<FileInfo | null>(null);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('DateAdded-descending');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const FILES_PER_PAGE = viewMode === 'grid' ? 18 : 12;

    const refetch = () => setRefetchIndex(i => i + 1);

    const handleUploadSuccess = (fileInfo: FileInfo) => {
        setIsUploadModalOpen(false);
        setActionStatus({ type: 'success', message: t('fileUploadSuccess') });
        setTimeout(refetch, 1000);
    };

    const handleUploadError = (message: string) => {
        setActionStatus({ type: 'error', message: `${t('fileUploadError', { error: '' })} ${message}` });
    };
    
    const confirmDeleteFile = async () => {
        if (!fileToDelete) return;
        try {
            await apiFetchV4(`/files/${encodeURIComponent(fileToDelete)}`, apiKey, { method: 'DELETE' });
            setActionStatus({ type: 'success', message: t('fileDeletedSuccess', { fileName: fileToDelete }) });
            refetch();
        } catch (err: any) {
            setActionStatus({ type: 'error', message: t('fileDeletedError', { error: err.message }) });
        } finally {
            setFileToDelete(null);
        }
    };
    
    const sortedAndFilteredFiles = useMemo(() => {
        if (!Array.isArray(files)) return [];

        const [key, direction] = sortOrder.split('-') as [keyof FileInfo, 'ascending' | 'descending'];

        return files
            .filter(file => file.FileName.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                const aValue = a[key];
                const bValue = b[key];
                
                let comparison = 0;
                if (key === 'DateAdded') {
                    comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
                } else if (key === 'FileName') {
                    comparison = (aValue as string).localeCompare(bValue as string);
                } else { // Size
                    comparison = (aValue as number) - (bValue as number);
                }
                
                return direction === 'descending' ? -comparison : comparison;
            });
    }, [files, searchQuery, sortOrder]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortOrder, viewMode]);

    const { paginatedFiles, totalPages } = useMemo(() => {
        const total = Math.ceil(sortedAndFilteredFiles.length / FILES_PER_PAGE);
        const paginated = sortedAndFilteredFiles.slice(
            (currentPage - 1) * FILES_PER_PAGE,
            currentPage * FILES_PER_PAGE
        );
        return { paginatedFiles: paginated, totalPages: total };
    }, [sortedAndFilteredFiles, currentPage, FILES_PER_PAGE]);

    const sortOptions = {
        "DateAdded-descending": "Recent first",
        "DateAdded-ascending": "Oldest first",
        "FileName-ascending": "Name (A-Z)",
        "FileName-descending": "Name (Z-A)",
        "Size-descending": "Size (Largest)",
        "Size-ascending": "Size (Smallest)",
    };

    return (
        <div>
            <ActionStatus status={actionStatus} onDismiss={() => setActionStatus(null)} />
            <FileUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                apiKey={apiKey}
                onSuccess={handleUploadSuccess}
                onError={handleUploadError}
            />
            <FilePreviewModal
                isOpen={!!fileToPreview}
                onClose={() => setFileToPreview(null)}
                fileInfo={fileToPreview}
                apiKey={apiKey}
            />
            <ConfirmModal
                isOpen={!!fileToDelete}
                onClose={() => setFileToDelete(null)}
                onConfirm={confirmDeleteFile}
                title={t('deleteFile')}
            >
                <p>{t('confirmDeleteFile', { fileName: fileToDelete })}</p>
            </ConfirmModal>

            <div className="view-header">
                <div className="search-bar">
                    <Icon path={ICONS.SEARCH}/>
                    <input 
                        type="search" 
                        placeholder={t('search')} 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)}
                        aria-label={t('search')}
                    />
                </div>
                <div className="header-actions">
                    <div className="view-switcher">
                        <button onClick={() => setViewMode('list')} className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`} aria-label="List view">
                            <Icon path={ICONS.EMAIL_LISTS} />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`} aria-label="Grid view">
                            <Icon path={ICONS.DASHBOARD} />
                        </button>
                    </div>
                    <select 
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        aria-label="Sort files by"
                    >
                        {Object.entries(sortOptions).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
                        <Icon path={ICONS.UPLOAD} /> {t('uploadFile')}
                    </button>
                </div>
            </div>

            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {!loading && !error && sortedAndFilteredFiles.length === 0 && (
                <CenteredMessage style={{height: '50vh'}}>
                    <div className="info-message">
                         <strong>{searchQuery ? t('noFilesFound') : t('noFilesFound')}</strong>
                         {!searchQuery && <p>{t('uploadNewFilePrompt')}</p>}
                    </div>
                </CenteredMessage>
            )}

            <div className={`file-container-view ${viewMode === 'grid' ? 'file-grid-view' : 'file-list-view'}`}>
                {paginatedFiles.map((file: FileInfo) => (
                    viewMode === 'grid' ? (
                        <FileGridCard
                            key={file.FileName}
                            fileInfo={file}
                            apiKey={apiKey}
                            onView={setFileToPreview}
                            onDelete={setFileToDelete}
                        />
                    ) : (
                        <FileCard
                            key={file.FileName}
                            fileInfo={file}
                            apiKey={apiKey}
                            onView={setFileToPreview}
                            onDelete={setFileToDelete}
                        />
                    )
                ))}
            </div>
            
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}>
                        <Icon path={ICONS.CHEVRON_LEFT} />
                        <span>{t('previous')}</span>
                    </button>
                    <span className="pagination-page-info">{t('page', { page: `${currentPage} / ${totalPages}` })}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading}>
                        <span>{t('next')}</span>
                        <Icon path={ICONS.CHEVRON_RIGHT} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default MediaManagerView;