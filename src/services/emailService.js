import api from './api';

/**
 * Envía un PDF generado en base64 por correo electrónico.
 * @param {string} emailDestino - Correo al que se enviará el PDF.
 * @param {string} asunto - Asunto del correo.
 * @param {string} pdfBase64 - El PDF en formato Data URI o Base64 puro.
 * @param {string} filename - Nombre sugerido del archivo adjunto (ej. reporte.pdf).
 * @returns {Promise<Object>} Promesa con la respuesta del servidor.
 */
export const sendPdfEmail = async (emailDestino, asunto, pdfBase64, filename) => {
    try {
        const response = await api.post(`/email/enviar`, {
            emailDestino,
            asunto,
            pdfBase64,
            filename
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Error de conexión con el servidor de correo';
    }
};
