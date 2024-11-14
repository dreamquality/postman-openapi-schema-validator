#!/usr/bin/env node

const { validate } = require('./src');
const path = require('path');

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
    console.log('postman-openapi-schema-validator version: 1.1.0');
    process.exit(0);
}

const collectionArgIndex = args.indexOf('--collection');
const specArgIndex = args.indexOf('--spec');
if (collectionArgIndex === -1 || specArgIndex === -1) {
    console.error('Usage: posv --collection <path_to_collection> --spec <path_to_openapi_spec>');
    process.exit(1);
}

const collectionPath = args[collectionArgIndex + 1];
const specPath = args[specArgIndex + 1];
const outputDir = path.resolve(__dirname);
const options = {
    statusCodeCheck: args.includes('--status-code-check'),
};

validate({ collectionPath, specPath, outputDir, options })
    .then((output) => console.log(`Validation completed. Updated collection saved to ${output}`))
    .catch((error) => {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    });
