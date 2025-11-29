import fs from 'fs';

// Utility functions
const capitalized = (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

const replaceWords = (text, wordsToReplace) => {
    return text.replace(/\b\w+\b/g, (match) => {
        console.log(match);
        const lower = match.toLowerCase();
        if(wordsToReplace.includes(lower)) {
            let replacement = replacementObject[lower];
            // Capitalize if original was capitalized
            if (match[0] === match[0].toUpperCase() && match.slice(1) === match.slice(1).toLowerCase()) {
                replacement = capitalized(replacement);
            }
            return replacement;
        }
        return match;
    });
}

// Files to work with
const originalTextsFolder = 'original-texts/en';
const modifiedTextsFolder = 'modified-texts/en';

// Check if the folders and files exist
if (!fs.existsSync(originalTextsFolder)) {
    console.error(`Original texts folder not found: ${originalTextsFolder}`);
    process.exit(1);
}

if (!fs.existsSync(modifiedTextsFolder)) {
    console.error(`Modified texts folder not found: ${modifiedTextsFolder}`);
    process.exit(1);
}

if (!fs.existsSync('replacement.json')) {
    console.error(`Replacement file not found: ${replacementFile}`);
    process.exit(1);
}

// Replacement file
const replacement = fs.readFileSync('replacement.json', 'utf8');
const replacementObject = JSON.parse(replacement);
const wordsToReplace = Object.keys(replacementObject);

// Original texts
const originalTextsFiles = fs.readdirSync('original-texts/en');

// Modify texts
for (const file of originalTextsFiles) {
    const originalText = fs.readFileSync(`${originalTextsFolder}/${file}`, 'utf8');
    const modifiedText = replaceWords(originalText, wordsToReplace);
    console.log(modifiedText);
    fs.writeFileSync(`${modifiedTextsFolder}/${file}`, modifiedText);
}

console.log('Texts modified successfully');