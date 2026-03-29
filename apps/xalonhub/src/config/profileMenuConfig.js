export const FREELANCER_SECTIONS = [
    {
        id: 'business_settings',
        title: 'Business Settings',
        subtitle: 'Get the best out of your XalonHub profile',
        items: [
            { id: 'f_basic_info', icon: 'business', label: 'Business name & Info', screen: 'BasicInfo' },
            { id: 'f_location', icon: 'location', label: 'Location', screen: 'LocationConfirm' },
            { id: 'f_social', icon: 'share-social', label: 'Social Profile', screen: 'ProfessionalDetails' },
            { id: 'f_bank', icon: 'card', label: 'Bank Details', screen: 'BankDetails' },
            { id: 'f_verification', icon: 'shield-checkmark', label: 'KYC Verification', screen: 'DocumentUpload' },
            { id: 'f_services', icon: 'settings', label: 'Services Setup', screen: 'ServiceCategory' },
            { id: 'f_working_hours', icon: 'time', label: 'Working Hours/Holidays', screen: 'WorkingHours' },
        ],
    },
    {
        id: 'help_support',
        title: 'How Can We Help',
        items: [
            { id: 'f_follow', icon: 'people', label: 'Follow us on Social Media', screen: 'SocialFollow' },
            { id: 'f_about', icon: 'information-circle', label: 'About XalonHub', screen: 'About' },
        ],
    },
    {
        id: 'others',
        title: 'Advanced & Other Settings',
        items: [
            { id: 'f_performance', icon: 'analytics', label: 'Performance Report', screen: 'PerformanceReport' },
            { id: 'f_customers', icon: 'clipboard', label: 'Customer List', screen: 'CustomerList' },
            { id: 'f_reviews', icon: 'star-outline', label: 'Feedback & Reviews', screen: 'Feedback' },
            { id: 'f_payment_history', icon: 'cash', label: 'Payment History', screen: 'PaymentHistory' },
        ],
    },
];

export const SALON_SECTIONS = [
    {
        id: 'business_settings',
        title: 'Business Settings',
        subtitle: 'Get the best out of your XalonHub profile',
        items: [
            { id: 's_basic_info', icon: 'business', label: 'Business name & Info', screen: 'SalonBasicInfo' },
            { id: 's_location', icon: 'location', label: 'Location', screen: 'SalonAddress' },
            { id: 's_social', icon: 'share-social', label: 'Social Profile', screen: 'ProfessionalDetails' },
            { id: 's_bank', icon: 'card', label: 'Bank Details', screen: 'BankDetails' },
            { id: 's_verification', icon: 'shield-checkmark', label: 'KYC Verification', screen: 'DocumentUpload' },
            { id: 's_working_hours', icon: 'time', label: 'Working Hours/Holidays', screen: 'SalonWorkingHours' },
            { id: 's_services', icon: 'settings', label: 'Services Setup', screen: 'SalonServiceSetup' },
            { id: 's_stylists', icon: 'people', label: 'Stylist Management', screen: 'StylistManagement' },
            { id: 's_facilities', icon: 'heart', label: 'Facilities', screen: 'Facilities' },
        ],
    },
    {
        id: 'help_support',
        title: 'How Can We Help',
        items: [
            { id: 's_follow', icon: 'people', label: 'Follow us on Social Media', screen: 'SocialFollow' },
            { id: 's_about', icon: 'information-circle', label: 'About XalonHub', screen: 'About' },
        ],
    },
    {
        id: 'others',
        title: 'Advanced & Other Settings',
        items: [
            { id: 's_performance', icon: 'analytics', label: 'Performance Report', screen: 'PerformanceReport' },
            { id: 's_customers', icon: 'clipboard', label: 'Customer List', screen: 'CustomerList' },
            { id: 's_reviews', icon: 'star-outline', label: 'Feedback & Reviews', screen: 'Feedback' },
            { id: 's_payment_history', icon: 'cash', label: 'Payment History', screen: 'PaymentHistory' },
            { id: 's_add_salon', icon: 'business', label: 'Add More Salon', screen: 'AddSalon' },
        ],
    },
];
