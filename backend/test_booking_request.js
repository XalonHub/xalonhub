const axios = require('axios');

async function testBooking() {
    const payload = {
        serviceIds: ["f9356dbd-62bc-4191-b5eb-1e39451f5e39"], // Deep Conditioning
        serviceMode: "AtHome",
        location: {
            city: "Tirunelveli",
            lat: 8.7139,
            lng: 77.7567,
            addressLine: "Test Address"
        },
        bookingDate: "2026-03-10",
        timeSlot: "10:00",
        customerId: "2861290f-64c6-4296-aefc-672b1e0015b0",
        customerPhone: "9320655303",
        serviceGender: "Male",
        beneficiaryName: "Self",
        salonId: "5fa3a0b4-6ddc-4758-b0a5-76edaa0cde86" // Sindhu
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post('http://localhost:5000/api/bookings/auto-assign', payload);
        console.log('Success!', response.status);
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Failed!', error.response?.status);
        console.error(JSON.stringify(error.response?.data || error.message, null, 2));
    }
}

testBooking();
