const fs = require('fs');
const path = require('path');

const screensDir = path.join(process.cwd(), 'src', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if useState is used but NOT imported
    if (content.includes('useState') && (!content.includes('import ') || !content.match(/import.*useState.*from/))) {

        // Try replacing an existing import statement for react
        if (content.match(/import\s+(?:\*\s+as\s+)?React.*?from\s+['"]react['"];/)) {
            content = content.replace(/import\s+(?:\*\s+as\s+)?React.*?from\s+['"]react['"];/, "import React, { useState, useEffect } from 'react';");
        }
        // Or curly braces only import
        else if (content.match(/import\s+\{.*\}\s+from\s+['"]react['"];/)) {
            content = content.replace(/import\s+\{/, "import React, { useState, useEffect, ");
        }
        // Fallback: just put it at the very top
        else {
            content = "import React, { useState, useEffect } from 'react';\n" + content;
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', file);
    }
});
console.log('Fix complete.');
