const fs = require('fs');
const os = require('os');
const path = require('path');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const envPath = path.join(__dirname, '..', '.env.local');
const ip = getLocalIp();

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    } else {
        console.log('.env.local not found, creating it.');
    }

    const key = 'EXPO_PUBLIC_API_URL';
    const regex = new RegExp(`^${key}=(.*)$`, 'm');
    const match = content.match(regex);

    let port = '8080'; // Default port
    let protocol = 'http';

    if (match) {
        const currentValue = match[1];
        try {
            // Try to parse as URL to preserve protocol and port
            // If currentValue is something like "http://192.168.1.5:3000/api", we want to keep /api too?
            // The user said "update EXPO_PUBLIC_API_URL to my local ip address".
            // Usually API_URL is the base.

            // Let's handle the case where it might be just an IP or invalid URL
            if (currentValue.includes('://')) {
                const urlObj = new URL(currentValue);
                port = urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80');
                protocol = urlObj.protocol.replace(':', '');
                // We might want to preserve path if it exists?
                // For now let's assume it's just origin.
            } else {
                // fallback if no protocol
                const portMatch = currentValue.match(/:(\d+)/);
                if (portMatch) port = portMatch[1];
            }
        } catch (e) {
            // Fallback regex for port
            const portMatch = currentValue.match(/:(\d+)/);
            if (portMatch) port = portMatch[1];
        }
    }

    const newValue = `${protocol}://${ip}:${port}`;
    const newLine = `${key}=${newValue}`;

    if (match) {
        content = content.replace(regex, newLine);
    } else {
        if (content && !content.endsWith('\n')) content += '\n';
        content += `${newLine}\n`;
    }

    fs.writeFileSync(envPath, content);
    console.log(`Updated ${key} to ${newValue}`);

    // Update backend application.properties
    const servicePath = path.join(__dirname, '..', '..', 'sole-service', 'src', 'main', 'resources', 'application.properties');
    if (fs.existsSync(servicePath)) {
        let serviceContent = fs.readFileSync(servicePath, 'utf8');
        const serviceKey = 'api.base.url';
        // Match api.base.url=http://.../api
        const serviceRegex = new RegExp(`^${serviceKey.replace(/\./g, '\\.')}=http://[^:]+:${port}/api$`, 'm');
        const newServiceValue = `${serviceKey}=http://${ip}:${port}/api`;

        // Use a broader regex to catch any existing value for this key
        const broadServiceRegex = new RegExp(`^${serviceKey.replace(/\./g, '\\.')}=(.*)$`, 'm');

        if (broadServiceRegex.test(serviceContent)) {
            serviceContent = serviceContent.replace(broadServiceRegex, newServiceValue);
            fs.writeFileSync(servicePath, serviceContent);
            console.log(`Updated ${serviceKey} in sole-service to ${newServiceValue}`);
        } else {
            console.log(`Could not find ${serviceKey} in application.properties`);
        }
    } else {
        console.log(`Backend properties file not found at: ${servicePath}`);
        // Try fallback path if the structure is different?
        // User said: locate application.properties in sole-service...
    }

} catch (error) {
    console.error('Error updating files:', error);
    process.exit(1);
}
