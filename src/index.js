#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const $RefParser = require('json-schema-ref-parser'); // To resolve $ref references

// Metrics for tracking validation
let totalRequests = 0;
let validatedRequests = 0;
let unvalidatedRequests = 0;

// Function to read JSON or YAML files
const readFile = async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const fileContents = fs.readFileSync(filePath, 'utf8');

    try {
        if (ext === '.json') {
            return JSON.parse(fileContents);
        } else if (ext === '.yaml' || ext === '.yml') {
            return yaml.parse(fileContents);
        } else {
            throw new Error('Unsupported file format. Please provide a JSON or YAML file.');
        }
    } catch (error) {
        throw new Error(`Error reading file ${filePath}: ${error.message}`);
    }
};

// Logging functions with color
const logSuccess = (message) => console.log('\x1b[32m%s\x1b[0m', `✓ ${message}`);
const logError = (message) => console.error('\x1b[31m%s\x1b[0m', `✗ ${message}`);

// Function to normalize paths with parameters
const normalizePath = (path) => {
    return path.replace(/(:[^/]+|{[^/]+})/g, '{}'); // Replace all parameters (:param or {param}) with {}
};

// Resolves Postman path, handling variables like {{server1}}
const resolvePostmanPath = (pathSegments) => {
    if (!Array.isArray(pathSegments)) {
        throw new Error('Invalid Postman request path.');
    }
    return `/${pathSegments.map(segment => (segment.startsWith('{{') ? '{}' : segment)).join('/')}`;
};

// Functions to retrieve schemas for 2xx statuses and default
const getSchemaForOpenAPI3 = (responses) => {
    return (
        responses?.['200']?.content?.['application/json']?.schema ||
        responses?.['201']?.content?.['application/json']?.schema ||
        responses?.['204']?.content?.['application/json']?.schema ||
        responses?.default?.content?.['application/json']?.schema ||
        null
    );
};

const getSchemaForOpenAPI2 = (responses) => {
    return (
        responses?.['200']?.schema ||
        responses?.['201']?.schema ||
        responses?.['204']?.schema ||
        responses?.default?.schema ||
        null
    );
};

// Function to add schema validation tests
const addSchemaValidationTest = (item, responseSchema) => {
    const validationScript = `
        const Ajv = require('ajv');
        const ajv = new Ajv({ allErrors: true });

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
                console.log('Schema validation errors:', validate.errors);
            }
            pm.expect(valid, "Schema errors: " + JSON.stringify(validate.errors, null, 2)).to.be.true;
        });
    `;

    item.event = item.event || [];
    const existingTest = item.event.find(e => e.listen === 'test');
    if (existingTest) {
        existingTest.script.exec.push(...validationScript.split('\n'));
    } else {
        item.event.push({
            listen: 'test',
            script: { exec: validationScript.split('\n') },
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
            script: { exec: statusCodeScript.split('\n') },
        });
    }
};

// Function to process each Postman item
const processItem = (item, openapiSpec, openapiVersion, options) => {
    try {
        totalRequests++;

        const requestPath = resolvePostmanPath(item.request.url.path);
        const normalizedRequestPath = normalizePath(requestPath);
        const requestMethod = item.request.method.toLowerCase();

        const paths = Object.keys(openapiSpec.paths).map(path => ({
            original: path,
            normalized: normalizePath(path),
        }));

        const matchedPath = paths.find(({ normalized }) => normalizedRequestPath === normalized);
        const matchedSchema = matchedPath
            ? openapiSpec.paths[matchedPath.original]?.[requestMethod]
            : null;

        if (!matchedSchema) {
            logError(`Schema not found for ${item.request.method} ${item.request.url.raw}`);
            unvalidatedRequests++;
            return;
        }

        const responseSchema =
            openapiVersion.startsWith('3.')
                ? getSchemaForOpenAPI3(matchedSchema.responses)
                : getSchemaForOpenAPI2(matchedSchema.responses);

        if (!responseSchema) {
            logError(`No response schema found for ${item.request.method} ${item.request.url.raw}`);
            unvalidatedRequests++;
            return;
        }

        addSchemaValidationTest(item, responseSchema);
        logSuccess(`Schema validation test added for ${item.request.method} ${item.request.url.raw}`);
        validatedRequests++;

        if (options.statusCodeCheck) {
            addStatusCodeTest(item, matchedSchema.responses);
            logSuccess(`Status code test added for ${item.request.method} ${item.request.url.raw}`);
        }
    } catch (error) {
        logError(`Error processing ${item.request.method} ${item.request.url.raw}: ${error.message}`);
        unvalidatedRequests++;
    }
};

// Processes collection items recursively
const processItemsRecursively = (items, openapiSpec, openapiVersion, options) => {
    items.forEach(item => {
        if (item.item) {
            processItemsRecursively(item.item, openapiSpec, openapiVersion, options);
        } else {
            processItem(item, openapiSpec, openapiVersion, options);
        }
    });
};

// Main function to process files
const validateCollection = async (collectionPath, specPath, options = {}) => {
    const postmanCollection = await readFile(collectionPath);
    const openapiSpec = await $RefParser.dereference(specPath);

    if (!postmanCollection.item || !Array.isArray(postmanCollection.item)) {
        throw new Error('Invalid Postman collection format.');
    }

    const openapiVersion = openapiSpec.openapi || openapiSpec.swagger;
    console.log(`OpenAPI version detected: ${openapiVersion}`);

    processItemsRecursively(postmanCollection.item, openapiSpec, openapiVersion, options);

    const outputFileName = `${path.basename(collectionPath, path.extname(collectionPath))}_with_validation.json`;
    await fs.promises.writeFile(outputFileName, JSON.stringify(postmanCollection, null, 2));

    logSuccess(`Validation completed. Updated collection saved to ${outputFileName}`);

    // Output metrics
    const coverage = ((validatedRequests / totalRequests) * 100).toFixed(2);
    console.log('\n--- Validation Summary ---');
    console.table([
        { Metric: 'Total Requests', Value: totalRequests },
        { Metric: 'Validated Requests', Value: validatedRequests },
        { Metric: 'Unvalidated Requests', Value: unvalidatedRequests },
        { Metric: 'Schema Coverage (%)', Value: `${coverage}%` },
    ]);

    return outputFileName;
};

// Handle command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--help')) {
        console.log(`
    Usage:
        posv --collection <path_to_collection> --spec <path_to_openapi_spec> [--status-code-check]
    
    Options:
        --collection        Path to the Postman collection JSON file
        --spec              Path to the OpenAPI specification file (JSON or YAML)
        --status-code-check Add additional checks for status codes in the collection
        --version           Show the utility version
        --help              Display this help message
        `);
        process.exit(0);
    }

    if (args.includes('--version')) {
        console.log('postman-openapi-schema-validator version: 1.1.1');
        process.exit(0);
    }

    const collectionArgIndex = args.indexOf('--collection');
    const specArgIndex = args.indexOf('--spec');
    const statusCodeCheckFlag = args.includes('--status-code-check');

    if (collectionArgIndex === -1 || specArgIndex === -1) {
        console.error('Usage: node cli.js --collection <path_to_collection> --spec <path_to_openapi_spec> [--status-code-check]');
        process.exit(1);
    }

    const collectionPath = args[collectionArgIndex + 1];
    const specPath = args[specArgIndex + 1];

    validateCollection(collectionPath, specPath, { statusCodeCheck: statusCodeCheckFlag }).catch(error => {
        console.error(`Validation failed: ${error.message}`);
        process.exit(1);
    });
}

// Export as a library
module.exports = {
    validateCollection,
};
