const { validateEnquiry } = require('../lib/enquiries');
const { sendEnquiryEmail } = require('../lib/send-enquiry-email');

module.exports = async function handler(request, response) {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');

    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        response.status(405).json({ error: 'Method not allowed.' });
        return;
    }

    const contentType = request.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
        response.status(415).json({ error: 'Content-Type must be application/json.' });
        return;
    }

    const result = validateEnquiry(request.body);
    if (result.error) {
        response.status(400).json({ error: result.error });
        return;
    }

    try {
        await sendEnquiryEmail(result.enquiry);
    } catch (error) {
        if (error.message === 'Email delivery is not configured.') {
            response.status(503).json({
                error: 'Email delivery is not configured yet. Please contact the store directly.'
            });
            return;
        }

        response.status(502).json({
            error: 'We could not deliver your enquiry right now. Please try again later.'
        });
        return;
    }

    response.status(201).json({ message: 'Thank you! Your enquiry has been emailed to our team.' });
};
