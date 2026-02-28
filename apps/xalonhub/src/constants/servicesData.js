export const SERVICES_BY_CATEGORY = {
    'Male': {
        '1': [ // Haircut & Styling
            { id: 'm1_1', name: 'Premium Haircut', duration: 45, priceType: 'Fixed', price: 500 },
            { id: 'm1_2', name: 'Beard Trim & Shape', duration: 30, priceType: 'Fixed', price: 300 },
            { id: 'm1_3', name: 'Hair Wash & Styling', duration: 20, priceType: 'Fixed', price: 200 },
        ],
        '2': [ // Beard & Grooming
            { id: 'm2_1', name: 'Classic Shave', duration: 25, priceType: 'Fixed', price: 250 },
            { id: 'm2_2', name: 'Beard Spa', duration: 45, priceType: 'Fixed', price: 800 },
        ],
        '3': [ // Facial & Clean-up
            { id: 'm3_1', name: 'Fruit Clean-up', duration: 40, priceType: 'Fixed', price: 1200 },
            { id: 'm3_2', name: 'O3+ Facial', duration: 60, priceType: 'Fixed', price: 2500 },
        ],
        '7': [ // Hair Colour
            { id: 'm7_1', name: 'Loreal Global Color', duration: 90, priceType: 'Fixed', price: 1500 },
            { id: 'm7_2', name: 'Beard Color', duration: 30, priceType: 'Fixed', price: 400 },
        ]
    },
    'Female': {
        '1': [ // Haircut & Styling
            { id: 'f1_1', name: 'Advanced Layer Cut', duration: 60, priceType: 'Fixed', price: 1200 },
            { id: 'f1_2', name: 'Blow Dry & Styling', duration: 45, priceType: 'Fixed', price: 800 },
        ],
        '5': [ // Threading
            { id: 'f5_1', name: 'Eyebrows threading', duration: 15, priceType: 'Fixed', price: 100 },
            { id: 'f5_2', name: 'Full Face threading', duration: 30, priceType: 'Fixed', price: 300 },
        ],
        '6': [ // Manicure & Pedicure
            { id: 'f6_1', name: 'Classic Manicure', duration: 45, priceType: 'Fixed', price: 600 },
            { id: 'f6_2', name: 'OPI Pedicure', duration: 60, priceType: 'Fixed', price: 1500 },
        ]
    }
};

export const CATEGORIES = [
    { id: '1', name: 'Haircut & Styling', thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&h=200&q=80' },
    { id: '2', name: 'Beard & Grooming', thumbnail: 'https://images.unsplash.com/photo-1599351431247-f10b21ce5634?auto=format&fit=crop&w=200&h=200&q=80' },
    { id: '3', name: 'Facial & Clean-up', thumbnail: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&h=200&q=80' },
    { id: '4', name: 'Waxing & Hair Removal', thumbnail: 'https://images.unsplash.com/photo-1598124832483-fb40539121a2?auto=format&fit=crop&w=200&h=200&q=80' },
    { id: '5', name: 'Threading', thumbnail: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=200&h=200&q=80' },
    { id: '6', name: 'Manicure & Pedicure', thumbnail: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=200&h=200&q=80' },
    { id: '7', name: 'Hair Colour', thumbnail: 'https://images.unsplash.com/photo-1605497745244-093bb6978107?auto=format&fit=crop&w=200&h=200&q=80' },
    { id: '8', name: 'Hair Treatment', thumbnail: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=200&h=200&q=80' },
    { id: '9', name: 'Advanced Skin', thumbnail: 'https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&w=200&h=200&q=80' },
    { id: '10', name: 'Massage & Spa', thumbnail: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?auto=format&fit=crop&w=200&h=200&q=80' },
    { id: '11', name: 'Makeup & Occasion', thumbnail: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&h=200&q=80' },
    { id: '12', name: 'Packages', thumbnail: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=200&h=200&q=80' },
];
