// Function to recursively sort object keys
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
