import { Platform } from 'react-native';
import api from './api';

/**
 * Uploads a file to the backend.
 * @param {string} uri - Local URI of the file
 * @returns {Promise<string>} - The uploaded file URL
 */
export const uploadFile = async (uri) => {
    if (!uri) return null;

    try {
        const formData = new FormData();

        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('file', {
            uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
            name: filename,
            type,
        });

        const response = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.data && response.data.url) {
            console.log('[UploadService] File uploaded successfully:', response.data.url);
            return response.data.url;
        } else {
            throw new Error('Upload failed: No URL returned');
        }
    } catch (error) {
        console.error('[UploadService] Upload error:', error?.response?.data || error.message);
        throw error;
    }
};

/**
 * Deletes a previously uploaded file from the server.
 * Safe to call with null/undefined or a local file:// URI — it will simply no-op.
 * Errors are silently swallowed so a failed delete never blocks the user's action.
 * @param {string|null} url - The remote URL returned by a previous uploadFile() call
 */
export const deleteFile = async (url) => {
    // Only act on remote URLs already stored on our server
    if (!url || !url.startsWith('http')) return;
    try {
        await api.delete('/upload', { data: { url } });
        console.log('[UploadService] Deleted old file:', url);
    } catch (error) {
        console.warn('[UploadService] Could not delete old file (non-critical):', error?.response?.data || error.message);
    }
};

export default {
    uploadFile,
    deleteFile,
};
