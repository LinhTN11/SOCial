// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dvzfqk9it';
const UPLOAD_PRESET = 'social_app_preset';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export const uploadImage = async (uri: string): Promise<string> => {
    try {
        console.log('Starting image upload to Cloudinary...');
        console.log('Image URI:', uri);

        const formData = new FormData();

        // Different handling for web vs mobile
        if (uri.startsWith('blob:') || uri.startsWith('http')) {
            // Web: convert blob to file
            console.log('Web platform detected, converting blob...');
            const response = await fetch(uri);
            const blob = await response.blob();
            formData.append('file', blob, 'upload.jpg');
        } else {
            // Mobile: use file URI directly
            console.log('Mobile platform detected, using file URI...');
            formData.append('file', {
                uri,
                type: 'image/jpeg',
                name: 'upload.jpg',
            } as any);
        }

        formData.append('upload_preset', UPLOAD_PRESET);

        console.log('Uploading to:', CLOUDINARY_URL);

        const uploadResponse = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            },
        });

        console.log('Upload response status:', uploadResponse.status);

        const data = await uploadResponse.json();
        console.log('Upload response data:', JSON.stringify(data));

        if (!uploadResponse.ok) {
            console.error('Cloudinary error:', data);
            throw new Error(data.error?.message || `Upload failed with status ${uploadResponse.status}`);
        }

        if (data.secure_url) {
            console.log('Upload successful! URL:', data.secure_url);
            return data.secure_url;
        } else {
            throw new Error('No URL returned from Cloudinary');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
        }
        throw error;
    }
};
