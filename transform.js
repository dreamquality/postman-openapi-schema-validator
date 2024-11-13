#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const $RefParser = require('json-schema-ref-parser');  // To resolve $ref references

// Getting command line arguments
const args = process.argv.slice(2);
const collectionArgIndex = args.indexOf('--collection');
const specArgIndex = args.indexOf('--spec');
const statusCodeCheckFlag = args.includes('--status-code-check');  // Flag for adding status code tests

if (collectionArgIndex === -1 || specArgIndex === -1 || !args[collectionArgIndex + 1] || !args[specArgIndex + 1]) {
    console.error('Usage: node transform.js --collection <path_to_collection> --spec <path_to_openapi_spec> [--status-code-check]');
    process.exit(1);
}

const collectionPath = args[collectionArgIndex + 1];
const specPath = args[specArgIndex + 1];

// Function to read JSON or YAML files
const readFile = async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    try {
        if (ext === '.json') {
            return JSON.parse(fileContents);
        } else if (ext === '.yaml' || ext === '.yml') {
            return yaml.load(fileContents);
        } else {
            throw new Error('Unsupported file format. Please provide a JSON or YAML file.');
        }
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error.message}`);
        process.exit(1);
    }
};

// Logging functions with color
const logSuccess = (message) => console.log('\x1b[32m%s\x1b[0m', `✓ ${message}`);
const logError = (message) => console.log('\x1b[31m%s\x1b[0m', `✗ ${message}`);

// Function to normalize paths with parameters
const normalizePath = (path) => {
    // Replace all parameters (:param or {param}) with {}
    return path.replace(/(:[^/]+|{[^/]+})/g, '{}');
};

// Function to match Postman requests with OpenAPI schemas
const matchRequestWithSchema = (postmanRequest, openapiSpec) => {
    const requestPath = `/${postmanRequest.url.path.join('/')}`;
    const normalizedRequestPath = normalizePath(requestPath);  // Normalize the request path
    const requestMethod = postmanRequest.method.toLowerCase();

    // Create an array of paths from the OpenAPI specification and normalize them
    const paths = Object.keys(openapiSpec.paths).map(path => {
        const normalizedPath = normalizePath(path); // Normalize the OpenAPI path
        return { original: path, normalized: normalizedPath };
    });

    // Search for matches by normalized path
    for (const { original, normalized } of paths) {
        if (normalizedRequestPath === normalized || normalizedRequestPath.startsWith(`${normalized}/`) || normalized.startsWith(`${normalizedRequestPath}/`)) {
            return openapiSpec.paths[original][requestMethod] || null;
        }
    }

    return null;
};

// Functions to retrieve schemas for 2xx statuses and default
const getSchemaForOpenAPI3 = (responses) => {
    return responses?.['200']?.content?.['application/json']?.schema ||
           responses?.['201']?.content?.['application/json']?.schema ||
           responses?.['204']?.content?.['application/json']?.schema ||
           responses?.default?.content?.['application/json']?.schema || null;
};

const getSchemaForOpenAPI2 = (responses) => {
    return responses?.['200']?.schema ||
           responses?.['201']?.schema ||
           responses?.['204']?.schema ||
           responses?.default?.schema || null;
};

// Function to add schema validation tests
const addSchemaValidationTest = (item, responseSchema) => {
    const validationScript = `
        const Ajv = require('ajv');
        const ajv = new Ajv({ allErrors: true });

        // Register custom format 'int32'
        ajv.addFormat('int32', {
            type: 'number',
            validate: (x) => Number.isInteger(x) && x >= -(2**31) && x <= 2**31 - 1,
        });

        const schema = ${JSON.stringify(responseSchema)};
        const validate = ajv.compile(schema);
        const data = pm.response.json();
        const valid = validate(data);

        pm.test("Response schema is valid", function() {
            if (!valid) {
                // Log schema validation errors
                console.log('Schema validation errors:', validate.errors);
            }
            pm.expect(valid, "Schema errors: " + JSON.stringify(validate.errors, null, 2)).to.be.true;
        });
    `;

    item.event = item.event || [];

    // Check for existing tests
    const existingTest = item.event.find(e => e.listen === 'test');
    if (existingTest) {
        // If tests already exist, add the new validation at the end
        existingTest.script.exec.push(...validationScript.split('\n'));
    } else {
        // If no tests exist, create a new test with validation
        item.event.push({
            listen: 'test',
            script: {
                exec: validationScript.split('\n')
            }
        });
    }
};

// Function to add status code check tests
const addStatusCodeTest = (item, responses) => {
    const statusCodes = Object.keys(responses).filter(code => code.startsWith('2'));
    const statusCodeScript = `
        pm.test("Status code is one of ${statusCodes.join(', ')}", function() {
            pm.expect(pm.response.code).to.be.oneOf([${statusCodes.join(', ')}]);
        });
    `;

    item.event = item.event || [];

    const existingTest = item.event.find(e => e.listen === 'test');
    if (existingTest) {
        existingTest.script.exec.push(...statusCodeScript.split('\n'));
    } else {
        item.event.push({
            listen: 'test',
            script: {
                exec: statusCodeScript.split('\n')
            }
        });
    }
};

// Function to process each Postman item
const processItem = (item, openapiSpec, openapiVersion) => {
    try {
        const matchedSchema = matchRequestWithSchema(item.request, openapiSpec);

        if (matchedSchema) {
            let responseSchema;

            if (openapiVersion.startsWith('3.')) {
                responseSchema = getSchemaForOpenAPI3(matchedSchema.responses);
            } else if (openapiVersion === '2.0') {
                responseSchema = getSchemaForOpenAPI2(matchedSchema.responses);
            } else {
                throw new Error('Unsupported OpenAPI version.');
            }

            if (responseSchema) {
                // Add schema validation tests
                addSchemaValidationTest(item, responseSchema);
                logSuccess(`Schema validation test added for ${item.request.method} ${item.request.url.raw}`);

                // If the --status-code-check flag is active, add status code tests
                if (statusCodeCheckFlag) {
                    addStatusCodeTest(item, matchedSchema.responses);
                    logSuccess(`Status code test added for ${item.request.method} ${item.request.url.raw}`);
                }
            } else {
                logError(`Schema for 200, 201, 204, or default not found for ${item.request.method} ${item.request.url.raw}`);
            }
        } else {
            logError(`Schema not found for ${item.request.method} ${item.request.url.raw}`);
        }
    } catch (error) {
        logError(`Error processing request ${item.request.method} ${item.request.url.raw}: ${error.message}`);
    }
};

// Function to recursively process nested items
const processItemsRecursively = (items, openapiSpec, openapiVersion) => {
    items.forEach((item) => {
        if (item.item) {
            // Recursively process nested items
            processItemsRecursively(item.item, openapiSpec, openapiVersion);
        } else {
            processItem(item, openapiSpec, openapiVersion);
        }
    });
};

// Main function to process files
const processFiles = async () => {
    let postmanCollection;
    let openapiSpec;

    try {
        postmanCollection = await readFile(collectionPath);
        if (!Array.isArray(postmanCollection.item)) {
            throw new Error('Invalid Postman collection format.');
        }
    } catch (error) {
        console.error(`Error processing Postman collection: ${error.message}`);
        process.exit(1);
    }

    try {
        openapiSpec = await $RefParser.dereference(specPath); // Pre-resolve $ref
        if (typeof openapiSpec.paths !== 'object') {
            throw new Error('Invalid OpenAPI specification format.');
        }
    } catch (error) {
        console.error(`Error processing OpenAPI specification: ${error.message}`);
        process.exit(1);
    }

    // Determine OpenAPI version
    const openapiVersion = openapiSpec.openapi || openapiSpec.swagger;
    console.log(`OpenAPI version detected: ${openapiVersion}`);

    // Recursively process collection items
    processItemsRecursively(postmanCollection.item, openapiSpec, openapiVersion);

    // Check if dist folder exists, if not, create it
    const distDir = path.resolve(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }

    // Save the updated collection in the dist folder
    try {
        const outputFileName = path.join(distDir, `${path.basename(collectionPath, path.extname(collectionPath))}_with_validation.json`);
        await fs.promises.writeFile(outputFileName, JSON.stringify(postmanCollection, null, 2));
        logSuccess(`Updated Postman collection saved as ${outputFileName}`);
    } catch (error) {
        logError(`Error saving updated Postman collection: ${error.message}`);
        process.exit(1);
    }
};

processFiles();
