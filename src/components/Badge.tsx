import React from 'react';
import Icon from './Icon';

interface BadgeProps {
    text: string;
    type?: 'success' | 'warning' | 'danger' | 'info' | 'default';
    color?: string; // Hex color for specific styling
    iconPath?: string;
}

const hexToRgba = (hex?: string, alpha = 0.1): string => {
    if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        return `rgba(128,128,128,${alpha})`; // fallback grey
    }
    let c: any = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${alpha})`;
};


const Badge = ({ text, type = 'default', color, iconPath }: BadgeProps) => {
    const style: React.CSSProperties = {};
    
    if (color) {
        style.backgroundColor = hexToRgba(color, 0.1);
        style.color = color;
    }

    return (
        <span className={`badge badge-${type}`} style={style}>
            {iconPath && <Icon path={iconPath} className="icon" style={{ width: '1em', height: '1em', marginRight: '0.4em', verticalAlign: 'text-bottom' }} />}
            {text}
        </span>
    );
};

export default Badge;