export const getPastDateByDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}
export const getPastDateByMonths = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
};
export const formatDateForApiV4 = (date: Date) => {
    return date.toISOString().slice(0, 19);
};
export const getPastDateByYears = (years: number) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
};
export const formatDateForDisplay = (dateString: string | undefined, locale = 'en-US') => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}
export const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const formatAxisLabel = (value: number, locale: string = 'en-US'): string => {
    const num = Math.round(value);

    // A more robust way to format large numbers for chart axes, avoiding potential
    // browser/environment inconsistencies with `notation: 'compact'`.
    if (num >= 1000000) {
        return (num / 1000000).toLocaleString(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        }) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toLocaleString(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        }) + 'K';
    }
    return num.toLocaleString(locale);
};
