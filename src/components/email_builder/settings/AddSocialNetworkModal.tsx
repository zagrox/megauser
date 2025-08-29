
import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../Modal';
import Icon, { SOCIAL_ICONS } from '../../Icon';

interface AddSocialNetworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (network: string) => void;
    existingNetworks: string[];
}

const AddSocialNetworkModal: React.FC<AddSocialNetworkModalProps> = ({ isOpen, onClose, onSelect, existingNetworks }) => {
    const { t } = useTranslation();

    const availableNetworks = Object.keys(SOCIAL_ICONS).filter(
        network => !existingNetworks.includes(network)
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('socialLinks')}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', padding: '0.5rem' }}>
                {availableNetworks.map(network => (
                    <button
                        key={network}
                        className="toolbar-item"
                        style={{ width: '100%', height: '100px', cursor: 'pointer' }}
                        onClick={() => onSelect(network)}
                    >
                        <Icon path={SOCIAL_ICONS[network].path} style={{ color: SOCIAL_ICONS[network].brandColor, width: '32px', height: '32px' }} />
                        <span>{t(network, { ns: 'translation', defaultValue: network })}</span>
                    </button>
                ))}
            </div>
        </Modal>
    );
};

export default AddSocialNetworkModal;
