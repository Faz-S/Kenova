import mammoth from 'mammoth';
import { renderAsync } from 'docx-preview';

export const isValidYouTubeURL = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
    return youtubeRegex.test(url);
};

export const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
};

export const processFile = async (file) => {
    if (!file) {
        throw new Error('No file selected');
    }

    const extension = getFileExtension(file.name);
    let content = null;

    switch (extension) {
        case 'pdf':
            content = URL.createObjectURL(file);
            break;

        case 'txt':
        case 'json':
        case 'js':
        case 'css':
        case 'html':
            content = await file.text();
            break;

        case 'doc':
        case 'docx':
            const arrayBuffer = await file.arrayBuffer();
            const container = document.createElement('div');
            await renderAsync(arrayBuffer, container);
            content = container.innerHTML;
            break;

        case 'odt':
        case 'rtf':
            const buffer = await file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
            content = result.value;
            break;

        case 'mp4':
        case 'webm':
        case 'ogg':
        case 'mov':
        case 'avi':
            content = URL.createObjectURL(file);
            break;

        default:
            throw new Error('Unsupported file type');
    }

    return { content, type: extension };
};

export const processYouTubeUrl = async (url) => {
    if (!isValidYouTubeURL(url)) {
        throw new Error('Please enter a valid YouTube URL');
    }

    const response = await fetch('http://127.0.0.1:5001/process/qa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
    });

    if (!response.ok) {
        throw new Error('Failed to process YouTube URL');
    }

    return { content: url, type: 'youtube' };
};
