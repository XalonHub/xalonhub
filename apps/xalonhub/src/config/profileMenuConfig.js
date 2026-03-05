export const FREELANCER_SECTIONS = [
    {
        id: 'business_settings',
        title: 'Business Settings',
        subtitle: 'Get the best out of your XalonHub profile',
        items: [
            { id: 'f_basic_info', icon: 'business', label: 'Business name & Info', screen: 'BasicInfo' },
            { id: 'f_location', icon: 'location', label: 'Location', screen: 'LocationConfirm' },
            { id: 'f_bank', icon: 'card', label: 'Bank Details', screen: 'BankDetails' },
            { id: 'f_personal_settings', icon: 'notifications', label: 'Personal Settings', screen: 'PersonalSettings' },
            { id: 'f_services', icon: 'settings', label: 'Services Setup', screen: 'ServiceCategory' },
            { id: 'f_working_hours', icon: 'time', label: 'Working Hours/Holidays', screen: 'WorkingHours' },
        ],
    },
    {
        id: 'social',
        title: 'Social Media',
        items: [
            { id: 'f_social', icon: 'share-social-outline', label: 'Social Media Profile Links', screen: 'ProfessionalDetails' },
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
];

export const SALON_SECTIONS = [
    {
        id: 'business_settings',
        title: 'Business Settings',
        subtitle: 'Get the best out of your XalonHub profile',
        items: [
            { id: 's_basic_info', icon: 'business', label: 'Business name & Info', screen: 'SalonBasicInfo' },
            { id: 's_location', icon: 'location', label: 'Location', screen: 'SalonAddress' },
            { id: 's_bank', icon: 'card', label: 'Bank Details', screen: 'BankDetails' },
            { id: 's_verification', icon: 'shield-checkmark', label: 'Business Verification', screen: 'DocumentUpload' },
            { id: 's_working_hours', icon: 'time', label: 'Working Hours/Holidays', screen: 'SalonWorkingHours' },
            { id: 's_services', icon: 'settings', label: 'Services Setup', screen: 'SalonServiceSetup' },
            { id: 's_staff', icon: 'people', label: 'Staff Management', screen: 'StaffManagement' },
        ],
    },
    {
        id: 'social',
        title: 'Social Media',
        items: [
            { id: 's_social', icon: 'share-social-outline', label: 'Social Media Profile Links', screen: 'ProfessionalDetails' },
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
            { id: 's_reviews', icon: 'star-outline', label: 'Customer Reviews', screen: 'CustomerReviews' },
            { id: 's_refer', icon: 'sync', label: 'Refer & Earn', screen: 'ReferEarn' },
            { id: 's_xcp', icon: 'cash', label: 'XalonHub Cash Points (XCP)', type: 'toggle', action: 'toggleXCP' },
            { id: 's_subadmin', icon: 'person-outline', label: 'Sub Admin', screen: 'SubAdmin' },
            { id: 's_facilities', icon: 'heart', label: 'Facilities', screen: 'Facilities' },
            { id: 's_payment_history', icon: 'cash', label: 'Payment History', screen: 'PaymentHistory' },
            { id: 's_add_salon', icon: 'business', label: 'Add More Salon', screen: 'AddSalon' },
        ],
    },
];
