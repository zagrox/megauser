import React, { useEffect } from 'react';
import Icon, { ICONS } from './Icon';

interface ActionStatusProps {
    status: { type: 'success' | 'error'; message: string } | null;
    onDismiss: () => void;
}

const ActionStatus = ({ status, onDismiss }: ActionStatusProps) => {
    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => {
                onDismiss();
            }, 5000); // Auto-dismiss after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [status, onDismiss]);

    if (!status) {
        return null;
    }

    const { type, message } = status;
    const isSuccess = type === 'success';
    const iconPath = isSuccess ? ICONS.CHECK : ICONS.X_CIRCLE;
    const className = `action-status action-status-${type}`;

    return (
        <div className={className} role="alert">
            <Icon path={iconPath} className="action-status-icon" />
            <span className="action-status-message">{message}</span>
            <button onClick={onDismiss} className="action-status-close" aria-label="Dismiss">
                &times;
            </button>
        </div>
    );
};

export default ActionStatus;
