import { toast } from 'sonner';

export const showSuccess = (title, description = '') => {
    toast.success(title, {
        description: description || undefined,
    });
};

export const showError = (title, description = '') => {
    const desc = typeof description === 'string'
        ? description
        : (description?.message || undefined);

    toast.error(title || 'Error', {
        description: desc,
    });
};

export const showWarning = (title, description = '') => {
    toast.warning(title, {
        description: description || undefined,
    });
};

export const showInfo = (title, description = '') => {
    toast.info(title, {
        description: description || undefined,
    });
};

export { toast };

