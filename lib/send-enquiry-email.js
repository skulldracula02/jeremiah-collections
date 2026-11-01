async function sendEnquiryEmail(enquiry) {
    const apiKey = process.env.RESEND_API_KEY;
    const sender = process.env.RESEND_FROM_EMAIL;
    const recipient = process.env.ENQUIRY_TO_EMAIL;

    if (!apiKey || !sender || !recipient) {
        throw new Error('Email delivery is not configured.');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: sender,
            to: [recipient],
            reply_to: enquiry.email,
            subject: `Website enquiry: ${enquiry.enquiryType}`,
            text: [
                `Name: ${enquiry.name}`,
                `Email: ${enquiry.email}`,
                `Phone: ${enquiry.phone}`,
                `Enquiry type: ${enquiry.enquiryType}`,
                `Preferred visit date: ${enquiry.visitDate || 'Not specified'}`,
                '',
                'Message:',
                enquiry.message
            ].join('\n')
        })
    });

    if (!response.ok) {
        const details = await response.text();
        console.error('Email provider rejected enquiry:', response.status, details);
        throw new Error('Email delivery failed.');
    }
}

module.exports = { sendEnquiryEmail };
