const allowedEnquiryTypes = new Set(['collection', 'appointment', 'stock', 'general']);

function validateEnquiry(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return { error: 'Please submit a valid enquiry.' };
    }

    const enquiry = {
        name: typeof payload.name === 'string' ? payload.name.trim() : '',
        email: typeof payload.email === 'string' ? payload.email.trim() : '',
        phone: typeof payload.phone === 'string' ? payload.phone.trim() : '',
        enquiryType: typeof payload.enquiryType === 'string' ? payload.enquiryType.trim() : '',
        visitDate: typeof payload.visitDate === 'string' ? payload.visitDate.trim() : '',
        message: typeof payload.message === 'string' ? payload.message.trim() : ''
    };
    const errors = [];

    if (enquiry.name.length < 2 || enquiry.name.length > 100) {
        errors.push('Name must be between 2 and 100 characters.');
    }
    if (enquiry.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) {
        errors.push('Please enter a valid email address.');
    }
    if (enquiry.phone.length > 30 || !/^[\d\s()+-]{10,}$/.test(enquiry.phone)) {
        errors.push('Please enter a valid phone number.');
    }
    if (!allowedEnquiryTypes.has(enquiry.enquiryType)) {
        errors.push('Please choose a valid enquiry type.');
    }
    if (enquiry.message.length < 20 || enquiry.message.length > 5000) {
        errors.push('Message must be between 20 and 5000 characters.');
    }
    if (enquiry.visitDate) {
        const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(enquiry.visitDate);
        const selectedDate = dateParts
            ? new Date(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]))
            : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (
            !selectedDate
            || selectedDate.getFullYear() !== Number(dateParts[1])
            || selectedDate.getMonth() !== Number(dateParts[2]) - 1
            || selectedDate.getDate() !== Number(dateParts[3])
            || selectedDate < today
        ) {
            errors.push('Please select a valid visit date that is not in the past.');
        }
    }

    return errors.length ? { error: errors.join(' ') } : { enquiry };
}

module.exports = { validateEnquiry };
