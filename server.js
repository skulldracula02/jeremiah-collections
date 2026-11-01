const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { validateEnquiry } = require('./lib/enquiries');

const rootDirectory = __dirname;
const dataDirectory = path.join(rootDirectory, '.data');
const enquiriesFile = path.join(dataDirectory, 'enquiries.jsonl');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT) || 4173;
const maximumRequestBytes = 16 * 1024;
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
};

function sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
    });
    response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        let receivedBytes = 0;
        let isTooLarge = false;

        request.setEncoding('utf8');
        request.on('data', (chunk) => {
            if (isTooLarge) {
                return;
            }
            receivedBytes += Buffer.byteLength(chunk);

            if (receivedBytes > maximumRequestBytes) {
                isTooLarge = true;
                reject(Object.assign(new Error('Request body is too large.'), { statusCode: 413 }));
                return;
            }

            body += chunk;
        });
        request.on('end', () => {
            if (!isTooLarge) {
                resolve(body);
            }
        });
        request.on('error', reject);
    });
}

async function handleSubmission(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        sendJson(response, 405, { error: 'Method not allowed.' });
        return;
    }

    if (!request.headers['content-type']?.includes('application/json')) {
        sendJson(response, 415, { error: 'Content-Type must be application/json.' });
        return;
    }

    let payload;
    try {
        payload = JSON.parse(await readRequestBody(request));
    } catch (error) {
        if (error.statusCode) {
            sendJson(response, error.statusCode, { error: error.message });
            return;
        }
        sendJson(response, 400, { error: 'Request body must contain valid JSON.' });
        return;
    }

    const result = validateEnquiry(payload);
    if (result.error) {
        sendJson(response, 400, { error: result.error });
        return;
    }

    const record = {
        ...result.enquiry,
        submittedAt: new Date().toISOString()
    };

    try {
        await fs.mkdir(dataDirectory, { recursive: true });
        await fs.appendFile(enquiriesFile, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 });
    } catch (error) {
        console.error('Unable to save enquiry:', error);
        sendJson(response, 500, { error: 'Unable to save your enquiry right now. Please try again later.' });
        return;
    }

    sendJson(response, 201, { message: 'Enquiry received successfully.' });
}

async function serveStaticFile(request, response, pathname) {
    const requestedPath = pathname === '/' ? '/index.html' : pathname;
    let decodedPath;

    try {
        decodedPath = decodeURIComponent(requestedPath);
    } catch {
        response.writeHead(400);
        response.end('Bad request');
        return;
    }

    const pathSegments = decodedPath.split(/[\\/]+/);
    if (pathSegments.some((segment) => segment.startsWith('.')) || path.basename(decodedPath) === 'server.js') {
        response.writeHead(404);
        response.end('Not found');
        return;
    }

    const filePath = path.resolve(rootDirectory, `.${decodedPath}`);
    if (!filePath.startsWith(`${rootDirectory}${path.sep}`)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    try {
        const file = await fs.readFile(filePath);
        response.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff'
        });
        response.end(request.method === 'HEAD' ? undefined : file);
    } catch (error) {
        if (error.code !== 'ENOENT' && error.code !== 'EISDIR') {
            console.error('Unable to serve requested file:', error);
            response.writeHead(500);
            response.end('Server error');
            return;
        }
        response.writeHead(404);
        response.end('Not found');
    }
}

const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    if (requestUrl.pathname === '/api/enquiries') {
        await handleSubmission(request, response);
        return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end('Method not allowed');
        return;
    }

    await serveStaticFile(request, response, requestUrl.pathname);
});

server.listen(port, host, () => {
    console.log(`Jeremiah Collections running at http://${host}:${port}`);
});
