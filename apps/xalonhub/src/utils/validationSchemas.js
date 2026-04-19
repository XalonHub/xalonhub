import * as yup from 'yup';

// Reusable regex
const phoneRegex = /^[0-9]{10}$/;
const pincodeRegex = /^[0-9]{6}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Common generic schemas
export const requiredString = (msg = 'This field is required') =>
    yup.string().trim().required(msg);

export const emailSchema = yup.string()
    .trim()
    .email('Please enter a valid email address')
    .required('Email is required');

export const phoneSchema = yup.string()
    .matches(phoneRegex, 'Please enter a valid 10-digit mobile number')
    .required('Mobile number is required');

export const pincodeSchema = yup.string()
    .matches(pincodeRegex, 'Pincode must be 6 digits')
    .required('Pincode is required');

// --- Screen Specific Schemas ---

export const personalInfoSchema = yup.object().shape({
    name: requiredString('Full Name is required')
        .max(50, 'Name cannot exceed 50 characters'),
    dob: requiredString('Date of Birth is required')
        .matches(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/, 'Format must be DD/MM/YYYY'),
    fatherName: requiredString('Father Name is required')
        .max(50, 'Name cannot exceed 50 characters'),
    gender: requiredString('Please select your gender'),
    genderPreference: requiredString('Please select who you provide services to'),
    email: emailSchema,
    travel: requiredString('Please select a travel method'),
    experience: yup.number()
        .typeError('Experience must be a number')
        .min(0, 'Experience cannot be negative')
        .required('Experience is required'),
    profileImg: requiredString('Profile Picture is required'),
    agentCode: yup.string().trim().optional(),
    about: yup.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
});

export const professionalDetailsSchema = yup.object().shape({
    facebook: yup.string().trim().transform(v => v === '' ? undefined : v).url('Must be a valid URL').optional().nullable(),
    instagram: yup.string().trim().transform(v => v === '' ? undefined : v).url('Must be a valid URL').optional().nullable(),
    youtube: yup.string().trim().transform(v => v === '' ? undefined : v).url('Must be a valid URL').optional().nullable(),
});

export const salonBasicInfoSchema = yup.object().shape({
    name: requiredString('Name is required'),
    businessName: requiredString('Business Name is required'),
    email: emailSchema,
    establishmentDate: requiredString('Establishment Date is required')
        .matches(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/, 'Format must be DD/MM/YYYY'),
    panCard: yup.string().trim()
        .matches(panRegex, { message: 'Invalid PAN Card format (e.g. ABCDE1234F)', excludeEmptyString: true })
        .optional(),
    gstNumber: yup.string().trim()
        .matches(gstRegex, { message: 'Invalid GST format (e.g. 07AAAAA0000A1Z5)', excludeEmptyString: true })
        .optional(),
    about: yup.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
    agentCode: yup.string().trim().optional(),
});

export const bankDetailsSchema = yup.object().shape({
    bankName: requiredString('Bank Name is required'),
    accName: requiredString('Account Holder Name is required'),
    ifsc: requiredString('IFSC Code is required')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format'),
    accNum: requiredString('Account Number is required')
        .matches(/^\d{9,18}$/, 'Account Number must be 9-18 digits'),
    reAccNum: requiredString('Please re-enter account number')
        .oneOf([yup.ref('accNum'), null], 'Account numbers do not match'),
    upiId: yup.string()
        .trim()
        .matches(/^[\w.-]+@[\w.-]+$/, 'Please enter a valid UPI ID (e.g. name@bank)')
        .optional()
});

export const addressSchema = yup.object().shape({
    address: requiredString('Address is required'),
    state: requiredString('State is required'),
    city: requiredString('City is required'),
    district: requiredString('District is required'),
    locality: requiredString('Locality is required'),
    pincode: pincodeSchema,
});

export const freelancerKycSchema = yup.object().shape({
    permAddress: addressSchema,
    currAddress: addressSchema,
    bank: bankDetailsSchema,
    documents: yup.object().shape({
        hasLicense: requiredString('Required'),
        dlName: yup.string().when('hasLicense', {
            is: 'Yes',
            then: (schema) => schema.required('Driving License Name is required'),
            otherwise: (schema) => schema.optional()
        }),
        dlDob: yup.string().when('hasLicense', {
            is: 'Yes',
            then: (schema) => schema.required('Date of Birth is required'),
            otherwise: (schema) => schema.optional()
        }),
        hasPoliceCert: requiredString('Required'),
        policeCertImage: yup.string().when('hasPoliceCert', {
            is: 'Yes',
            then: (schema) => schema.required('Certificate Image is required'),
            otherwise: (schema) => schema.optional().nullable()
        })
    })
});

export const documentUploadSchema = yup.object().shape({
    aadhaarFront: requiredString('Aadhaar Front Image is required'),
    aadhaarBack: requiredString('Aadhaar Back Image is required'),
    aadhaarNum: requiredString('Aadhaar Number is required')
        .matches(/^\d{4}\s\d{4}\s\d{4}$/, 'Aadhaar must be 12 digits'),
    licenseNum: yup.string().when('$workPreference', {
        is: 'salon',
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.required('License Number is required')
    }),
    licenseImg: yup.string().when('$workPreference', {
        is: 'salon',
        then: (schema) => schema.optional().nullable(),
        otherwise: (schema) => schema.required('License Image is required')
    }),
    hasPoliceCert: yup.boolean().required(),
    policeNum: yup.string().when('hasPoliceCert', {
        is: true,
        then: (schema) => schema
            .matches(/^[a-zA-Z0-9]+$/, 'Special characters and spaces are not allowed')
            .required('Certificate Number is required'),
        otherwise: (schema) => schema.optional()
    }),
    policeImg: yup.string().when('hasPoliceCert', {
        is: true,
        then: (schema) => schema.required('Certificate Image is required'),
        otherwise: (schema) => schema.optional().nullable()
    }),
    // Freelancer-specific
    showcaseImages: yup.array().of(yup.string()).max(5, 'Maximum of 5 photos allowed').optional(),
    // Registration Certificate (Salon only)
    regCertificateNum: yup.string().when('$workPreference', {
        is: 'salon',
        then: (schema) => schema
            .matches(/^[a-zA-Z0-9]+$/, 'Special characters and spaces are not allowed')
            .required('Registration Certificate Number is required'),
        otherwise: (schema) => schema.optional()
    }),
    regCertificateImg: yup.string().when('$workPreference', {
        is: 'salon',
        then: (schema) => schema.required('Registration Certificate Image is required'),
        otherwise: (schema) => schema.optional().nullable()
    }),
});

export const salonCoverSchema = yup.object().shape({
    logo: yup.string().nullable().optional(),
    banner: yup.string().nullable().optional(),
    inside: yup.array().of(yup.string()).max(3, 'Max 3 images allowed for inside'),
    outside: yup.array().of(yup.string()).max(3, 'Max 3 images allowed for outside')
});
