const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// Text-based MIME types that should use UTF-8 encoding
const textTypes = new Set([
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'image/svg+xml'
]);

const server = http.createServer((req, res) => {
    // Sanitize URL for logging to prevent log injection
    const sanitizedUrl = req.url.replace(/[\r\n]/g, '');
    console.log(`${req.method} ${sanitizedUrl}`);

    // Parse and normalize the requested path to prevent directory traversal
    let filePath = path.normalize(req.url);
    
    // Remove query string and fragment
    filePath = filePath.split('?')[0].split('#')[0];
    
    // Default to index.html for root path
    if (filePath === '/' || filePath === '.') {
        filePath = '/index.html';
    }
    
    // Remove leading slash for file system access
    if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
    }
    
    // Prevent directory traversal - ensure path doesn't escape current directory
    const resolvedPath = path.resolve(__dirname, filePath);
    if (!resolvedPath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(resolvedPath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found, serve index.html for client-side routing
                fs.readFile(path.resolve(__dirname, 'index.html'), (error, content) => {
                    if (error) {
                        res.writeHead(500);
                        res.end('Error loading index.html');
                    } else {
                        res.writeHead(200, { 
                            'Content-Type': 'text/html',
                            'Cross-Origin-Embedder-Policy': 'require-corp',
                            'Cross-Origin-Opener-Policy': 'same-origin'
                        });
                        res.end(content, 'utf-8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin'
            });
            // Only use UTF-8 encoding for text-based content
            if (textTypes.has(contentType)) {
                res.end(content, 'utf-8');
            } else {
                res.end(content);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving Gravity Heist game files...`);
});
