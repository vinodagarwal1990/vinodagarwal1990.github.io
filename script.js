// Function to derive encryption key from password
async function getKey(password) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("salt"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

// Function to encrypt text
async function encrypt(text, password) {
    try {
        const key = await getKey(password);
        const enc = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            enc.encode(text)
        );

        // Combine IV and encrypted data
        const encryptedContent = new Uint8Array(iv.length + encrypted.byteLength);
        encryptedContent.set(iv);
        encryptedContent.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...encryptedContent));
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Encryption failed');
    }
}

// Function to decrypt text
async function decrypt(encryptedText, password) {
    try {
        const key = await getKey(password);
        const encryptedData = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

        // Extract IV and encrypted content
        const iv = encryptedData.slice(0, 12);
        const encrypted = encryptedData.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encrypted
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Decryption failed');
    }
}

// Handle encryption button click
async function handleEncrypt() {
    const text = document.getElementById('text').value;
    const secret = document.getElementById('secret').value;
    const resultDiv = document.getElementById('result');
    
    if (!text || !secret) {
        showResult('Please enter both text and secret key', 'danger');
        return;
    }
    
    try {
        const encrypted = await encrypt(text, secret);
        showResult(`<strong>Encrypted:</strong> ${encrypted}`, 'success');
    } catch (error) {
        showResult(error.message, 'danger');
    }
}

// Handle decryption button click
async function handleDecrypt() {
    const text = document.getElementById('text').value;
    const secret = document.getElementById('secret').value;
    const resultDiv = document.getElementById('result');
    
    if (!text || !secret) {
        showResult('Please enter both text and secret key', 'danger');
        return;
    }
    
    try {
        const decrypted = await decrypt(text, secret);
        showResult(`<strong>Decrypted:</strong> ${decrypted}`, 'success');
    } catch (error) {
        showResult(error.message, 'danger');
    }
}

// Helper function to show results
function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.className = `alert alert-${type} mt-3`;
    resultDiv.innerHTML = message;
    resultDiv.classList.remove('d-none');
}

// Tab switching functionality
function switchTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Deactivate all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(tabId).classList.add('active');

    // Activate selected tab
    document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');
}

// JSON formatting functionality
function formatJSON() {
    const jsonInput = document.getElementById('json-input').value;
    const formattedJsonPre = document.getElementById('formatted-json');
    const copyButton = document.getElementById('copy-json');
    
    if (!jsonInput.trim()) {
        formattedJsonPre.textContent = 'Please enter JSON to format';
        formattedJsonPre.className = 'alert alert-warning';
        formattedJsonPre.classList.remove('d-none');
        copyButton.classList.add('d-none');
        return;
    }
    
    try {
        // Function to recursively unescape JSON strings
        function unescapeJSON(obj) {
            if (typeof obj === 'string') {
                try {
                    // Try to parse the string as JSON
                    const parsed = JSON.parse(obj);
                    // If successful and result is an object/array, recurse
                    if (typeof parsed === 'object' && parsed !== null) {
                        return unescapeJSON(parsed);
                    }
                    // If it's not an object/array, return the parsed value
                    return parsed;
                } catch (e) {
                    // If parsing fails, it's a regular string
                    return obj;
                }
            }
            
            // Handle arrays
            if (Array.isArray(obj)) {
                return obj.map(item => unescapeJSON(item));
            }
            
            // Handle objects
            if (typeof obj === 'object' && obj !== null) {
                const result = {};
                for (const [key, value] of Object.entries(obj)) {
                    result[key] = unescapeJSON(value);
                }
                return result;
            }
            
            // Return primitives as is
            return obj;
        }

        // First parse the input JSON
        let parsedJSON = JSON.parse(jsonInput);
        
        // Recursively unescape any nested JSON strings
        parsedJSON = unescapeJSON(parsedJSON);
        
        // Sort keys if the input is an object
        if (typeof parsedJSON === 'object' && parsedJSON !== null && !Array.isArray(parsedJSON)) {
            parsedJSON = sortObjectKeys(parsedJSON);
        }
        
        // Format with indentation
        const formattedJSON = JSON.stringify(parsedJSON, null, 2);
        
        // Display the formatted JSON
        formattedJsonPre.className = '';
        formattedJsonPre.classList.remove('d-none');
        formattedJsonPre.textContent = formattedJSON;
        
        // Show the copy button
        copyButton.classList.remove('d-none');
    } catch (error) {
        formattedJsonPre.textContent = 'Invalid JSON: ' + error.message;
        formattedJsonPre.className = 'alert alert-danger';
        formattedJsonPre.classList.remove('d-none');
        copyButton.classList.add('d-none');
    }
}

// Function to sort object keys recursively
function sortObjectKeys(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }

    return Object.keys(obj)
        .sort()
        .reduce((sorted, key) => {
            sorted[key] = sortObjectKeys(obj[key]);
            return sorted;
        }, {});
}

// Copy formatted JSON to clipboard
function copyJSON() {
    const formattedJson = document.getElementById('formatted-json').textContent;
    navigator.clipboard.writeText(formattedJson).then(() => {
        const copyButton = document.getElementById('copy-json');
        const originalHtml = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="bi bi-check2"></i> Copied!';
        copyButton.classList.remove('btn-outline-secondary');
        copyButton.classList.add('btn-success');
        
        setTimeout(() => {
            copyButton.innerHTML = originalHtml;
            copyButton.classList.remove('btn-success');
            copyButton.classList.add('btn-outline-secondary');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}
