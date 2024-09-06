const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Получение аргументов командной строки
const args = process.argv.slice(2);
const specArgIndex = args.indexOf('--spec');

if (specArgIndex === -1 || !args[specArgIndex + 1]) {
    console.error('Usage: node validateOpenAPI.js --spec <path_to_openapi_spec>');
    process.exit(1);
}

const specPath = args[specArgIndex + 1];

// Функция для чтения файла JSON или YAML
function readFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const fileContents = fs.readFileSync(filePath, 'utf8');

    try {
        if (ext === '.json') {
            return JSON.parse(fileContents);
        } else if (ext === '.yaml' || ext === '.yml') {
            return yaml.load(fileContents, { 
                onWarning: (warning) => {
                    console.warn(`YAML Warning: ${warning.message}`);
                }
            });
        } else {
            throw new Error('Unsupported file format. Please provide a JSON or YAML file.');
        }
    } catch (error) {
        if (error.name === 'SyntaxError') {
            console.error(`Syntax Error in file ${filePath}: ${error.message}`);
            if (error.location) {
                console.error(`Error Location: Line ${error.location.line}, Column ${error.location.column}`);
            }
        } else if (error.name === 'YAMLException') {
            console.error(`YAML Error in file ${filePath}: ${error.message}`);
        } else {
            console.error(`Error reading file ${filePath}: ${error.message}`);
        }
        process.exit(1);
    }
}

// Чтение OpenAPI спецификации
let openapiSpec;
try {
    openapiSpec = readFile(specPath);
    if (!openapiSpec.paths || typeof openapiSpec.paths !== 'object') {
        throw new Error('Invalid OpenAPI specification format. The "paths" property is either missing or not an object.');
    }

    const openapiVersion = openapiSpec.openapi || openapiSpec.swagger;
    if (!openapiVersion) {
        throw new Error('OpenAPI version is missing. Ensure your specification includes the "openapi" or "swagger" field.');
    }
    console.log(`OpenAPI version detected: ${openapiVersion}`);
} catch (error) {
    console.error(`Error processing OpenAPI specification: ${error.message}`);
    if (error.message.includes('Invalid OpenAPI specification format')) {
        console.error('Ensure your OpenAPI specification has a valid "paths" object and is correctly formatted.');
    } else if (error.message.includes('OpenAPI version is missing')) {
        console.error('Make sure your OpenAPI specification includes the "openapi" field (for OpenAPI 3.x) or the "swagger" field (for Swagger 2.0).');
    } else {
        console.error('An unexpected error occurred:', error);
    }
    process.exit(1);
}
