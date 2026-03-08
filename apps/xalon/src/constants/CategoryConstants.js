export const CATEGORY_METADATA = {
    'Hair': {
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80',
    },
    'Hair & Styling': {
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80',
    },
    'Facial': {
        image: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=500&q=80',
    },
    'Facial & Skin Care': {
        image: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=500&q=80',
    },
    'Massage': {
        image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=500&q=80',
    },
    'Massage & Wellness': {
        image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=500&q=80',
    },
    'Manicure': {
        image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80',
    },
    'Nails': {
        image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80',
    },
    'Manicure & Pedicure': {
        image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80',
    },
    'Makeup': {
        image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&q=80',
    },
    'Makeup & Bridal': {
        image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&q=80',
    },
    'Grooming': {
        image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&q=80',
    },
    'Grooming Essentials': {
        image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&q=80',
    },
    'Threading': {
        image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&q=80',
    },
    'Hair Colouring': {
        image: 'https://images.unsplash.com/photo-1605497745244-093bb6978107?w=500&q=80',
    },
    'Hair Treatments': {
        image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&q=80',
    },
    'Advanced Skin': {
        image: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=500&q=80',
    },
    'Premium Packages': {
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80',
    },
    'Waxing & Hair Removal': {
        image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&q=80',
    }
};

export const getCategoryMetadata = (name) => {
    // Default label to the actual database name
    const meta = CATEGORY_METADATA[name] || {};
    return {
        label: name, // Always use the actual name from DB
        image: meta.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80', // Fallback
    };
};
