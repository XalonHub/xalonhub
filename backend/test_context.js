
function setFormData(callback) {
    console.log('setFormData called');
    // Simulate React deferring the callback
    setTimeout(() => {
        console.log('setFormData callback running');
        const prev = { partnerId: '123' };
        const next = callback(prev);
        console.log('setFormData callback finished, next state:', next);
    }, 0);
}

async function updateFormData(section, values) {
    let currentPartnerId = null;
    console.log('updateFormData started');

    setFormData(prev => {
        const newFormData = { ...prev, [section]: values };
        currentPartnerId = newFormData.partnerId;
        console.log('Inside callback: currentPartnerId =', currentPartnerId);
        return newFormData;
    });

    console.log('After setFormData: currentPartnerId =', currentPartnerId);

    if (currentPartnerId) {
        console.log('Syncing to API with partnerId:', currentPartnerId);
    } else {
        console.log('NOT syncing to API because currentPartnerId is null');
    }
}

updateFormData('test', 'data');
