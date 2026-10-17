// Function to convert a Blob to a Base64 string
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                // We only want the base64 part, so we split "data:mime/type;base64,"
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read blob as a Base64 string."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Function to convert a Base64 string back to a Blob
export const base64ToBlob = (base64: string, mimeType: string): Blob => {
    try {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    } catch (e) {
        console.error("Failed to decode base64 string:", e);
        // Return an empty blob as a fallback to prevent crashing
        return new Blob([], { type: mimeType });
    }
};