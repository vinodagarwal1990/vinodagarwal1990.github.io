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
        resultDiv.innerHTML = '<span style="color: red;">Please enter both text and secret key</span>';
        return;
    }
    
    try {
        const encrypted = await encrypt(text, secret);
        resultDiv.innerHTML = `<strong>Encrypted:</strong> ${encrypted}`;
    } catch (error) {
        resultDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    }
}

// Handle decryption button click
async function handleDecrypt() {
    const text = document.getElementById('text').value;
    const secret = document.getElementById('secret').value;
    const resultDiv = document.getElementById('result');
    
    if (!text || !secret) {
        resultDiv.innerHTML = '<span style="color: red;">Please enter both text and secret key</span>';
        return;
    }
    
    try {
        const decrypted = await decrypt(text, secret);
        resultDiv.innerHTML = `<strong>Decrypted:</strong> ${decrypted}`;
    } catch (error) {
        resultDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    }
}