import fs from 'fs';
import path from 'path';

// Load replacement mappings
const replacementFile = fs.readFileSync('replacement.json', 'utf8');
const replacements = JSON.parse(replacementFile);

/**
 * Creates case variations of a word
 * Returns: lowercase, capitalized, uppercase
 */
function getCaseVariations(word) {
    return {
        lower: word.toLowerCase(),
        capitalized: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        upper: word.toUpperCase()
    };
}

/**
 * Replaces a word/phrase in text, handling all case variations and preserving original case
 */
function replaceWordInText(text, originalWord, replacementWord) {
    const variations = getCaseVariations(originalWord);
    const replacementVariations = getCaseVariations(replacementWord);
    
    let result = text;
    
    // Check if it's a phrase (contains spaces) or single word
    const isPhrase = originalWord.includes(' ');
    
    if (isPhrase) {
        // For phrases, match exactly (case-insensitive) and preserve the case pattern
        const phraseRegex = new RegExp(escapeRegex(originalWord), 'gi');
        result = result.replace(phraseRegex, (match) => {
            // Check if match starts with uppercase
            if (match[0] === match[0].toUpperCase()) {
                // Capitalize first letter of each word in replacement
                return replacementVariations.capitalized;
            } else if (match === match.toUpperCase()) {
                return replacementVariations.upper;
            }
            return replacementVariations.lower;
        });
    } else {
        // For single words, use word boundaries to avoid partial matches
        const wordRegex = new RegExp(`\\b${escapeRegex(variations.lower)}\\b`, 'gi');
        result = result.replace(wordRegex, (match) => {
            // Determine the case of the matched word and preserve it
            const matchLower = match.toLowerCase();
            const replacementLower = replacementVariations.lower;
            
            if (match === variations.upper) {
                // Entire word is uppercase
                return replacementVariations.upper;
            } else if (match[0] === match[0].toUpperCase()) {
                // First letter is uppercase (capitalized or title case)
                return replacementVariations.capitalized;
            } else {
                // All lowercase
                return replacementVariations.lower;
            }
        });
    }
    
    return result;
}

/**
 * Escapes special regex characters
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Recursively processes an object/array/value and replaces words in string values
 */
function processValue(value, replacements) {
    if (typeof value === 'string') {
        let result = value;
        // Apply all replacements to the string
        for (const [originalWord, replacementWord] of Object.entries(replacements)) {
            result = replaceWordInText(result, originalWord, replacementWord);
        }
        return result;
    } else if (Array.isArray(value)) {
        return value.map(item => processValue(item, replacements));
    } else if (value !== null && typeof value === 'object') {
        const processed = {};
        for (const [key, val] of Object.entries(value)) {
            processed[key] = processValue(val, replacements);
        }
        return processed;
    }
    return value;
}

/**
 * Processes a JSON file: reads, processes, and writes the result
 */
function processJsonFile(filePath, outputPath, replacements) {
    try {
        console.log(`Processing: ${path.basename(filePath)}`);
        let content = fs.readFileSync(filePath, 'utf8');
        // Remove BOM (Byte Order Mark) if present
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        const jsonData = JSON.parse(content);
        
        // Process all values recursively
        const processed = processValue(jsonData, replacements);
        
        // Write to output file, preserving original formatting
        const outputContent = JSON.stringify(processed, null, '\t');
        fs.writeFileSync(outputPath, outputContent, 'utf8');
        
        console.log(`  ✓ Completed: ${path.basename(outputPath)}`);
    } catch (error) {
        console.error(`  ✗ Error processing ${filePath}:`, error.message);
    }
}

// Main execution
const originalTextsFolder = 'original-texts/en';
const modifiedTextsFolder = 'modified-texts/en';

// Check if folders exist
if (!fs.existsSync(originalTextsFolder)) {
    console.error(`Error: Original texts folder not found: ${originalTextsFolder}`);
    process.exit(1);
}

if (!fs.existsSync(modifiedTextsFolder)) {
    console.error(`Error: Modified texts folder not found: ${modifiedTextsFolder}`);
    process.exit(1);
}

if (!fs.existsSync('replacement.json')) {
    console.error(`Error: Replacement file not found: replacement.json`);
    process.exit(1);
}

// Get all JSON files from original-texts folder
const files = fs.readdirSync(originalTextsFolder)
    .filter(file => file.endsWith('.json'));

if (files.length === 0) {
    console.error('No JSON files found in original-texts/en folder');
    process.exit(1);
}

console.log(`Found ${files.length} JSON file(s) to process`);
console.log(`Replacements to apply: ${Object.keys(replacements).join(', ')}\n`);

// Process each file
for (const file of files) {
    const inputPath = path.join(originalTextsFolder, file);
    const outputPath = path.join(modifiedTextsFolder, file);
    processJsonFile(inputPath, outputPath, replacements);
}

console.log('\n✓ All files processed successfully!');

