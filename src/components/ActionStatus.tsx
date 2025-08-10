import React, { useEffect } from 'react';

const ActionStatus = ({ status, onDismiss }: { status: {type: 'success' | 'error', message: string} | null, onDismiss?: () => void }) => {
    useEffect(() => {
        if (status && status.type === 'success' && onDismiss) {
            const timer = setTimeout(() => {
                onDismiss();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [status, onDismiss]);

    if (!status?.message) return null;
    return (
        <div className={`action-status ${status.type}`}>
            {status.message}
            {onDismiss && <button onClick={onDismiss} className="dismiss-btn">&times;</button>}
        </div>
    );
};

export default ActionStatus;
