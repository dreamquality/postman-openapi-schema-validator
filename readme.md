
![npm](https://img.shields.io/npm/v/postman-openapi-schema-validator?color=blue&label=npm&logo=npm)  
![Integration Tests](https://github.com/dreamquality/postman-openapi-schema-validator/actions/workflows/test.yml/badge.svg)

# OpenAPI to Postman Schema Validator

This project provides a Node.js utility for automating the validation of Postman request responses against OpenAPI (Swagger) schemas. It works both as a **command-line tool** and a **library**, making it flexible for various use cases. The utility reads OpenAPI specifications (in JSON or YAML format) and Postman collections (in JSON format), then inserts schema validation scripts into the Postman collection based on OpenAPI definitions. Ensure that your OpenAPI specifications contain schemas, as empty schemas won't be added.

---

## Features

- **Supports OpenAPI versions:** 2.0, 3.0.0, 3.0.1, and higher.
- **Automates schema validation:** Adds schema validation scripts to Postman requests.
- **Debugging:** Logs validation results in the console.
- **Improved Postman collections:** Generates new Postman collections with added schema validation for 20X status codes.
- **Uses AJV:** Validates API responses against OpenAPI schemas.
- **Preserves existing tests:** Does not overwrite existing Postman scripts; new scripts are appended.
- **Status code checks:** Automatically adds status code validation based on OpenAPI specifications.
- **Flexible usage:** Can be used via CLI or imported as a library.

---

## Requirements

- **Node.js:** Version 14.x or later.
- **NPM:** Version 6.x or later.

---

## Benefits for QA

1. **Accurate schema validation:** Ensures API contracts are always up to date.
2. **Saves time:** Eliminates the need for manual schema validation creation in Postman.
3. **Seamless CI/CD integration:** Can be used before running tests to focus on business logic and data state validations.
4. **Supports multiple formats:** Works with OpenAPI (Swagger), JSON, and YAML.

---

## Installation

### Global Installation (for CLI usage)

Install the utility globally with npm:

```sh
npm install -g postman-openapi-schema-validator
```

This makes the `posv` command available globally in the terminal.

### Local Installation (for library usage)

Install the utility locally in your project:

```sh
npm install postman-openapi-schema-validator
```

Import it into your code:

```javascript
const { validateCollection } = require('postman-openapi-schema-validator');
```

---

## Usage

### CLI

To validate a Postman collection against an OpenAPI specification, use the following command:

```sh
posv --collection path/to/postman_collection.json --spec path/to/openapi_spec.yaml
```

To include additional status code validation:

```sh
posv --collection path/to/postman_collection.json --spec path/to/openapi_spec.yaml --status-code-check
```

### Library

Use the utility in your code for greater flexibility:

```javascript
const { validateCollection } = require('postman-openapi-schema-validator');

const collectionPath = './path/to/postman_collection.json';
const specPath = './path/to/openapi_spec.yaml';
const options = { statusCodeCheck: true };

validateCollection(collectionPath, specPath, options)
    .then((outputPath) => {
        console.log(`Validation completed. Output saved to: ${outputPath}`);
    })
    .catch((error) => {
        console.error(`Validation failed: ${error.message}`);
    });
```

---

## Console Report

### Example Output

The utility logs detailed results to the console. Here's an example output showing validation summaries:

```plaintext
OpenAPI version detected: 3.0.1
✓ Schema validation test added for POST /pet
✗ Schema not found for GET /unknown
✓ Schema validation test added for DELETE /user/{id}

--- Validation Summary ---
┌─────────────────────┬────────┐
│ Metric              │ Value  │
├─────────────────────┼────────┤
│ Total Requests      │ 10     │
│ Validated Requests  │ 8      │
│ Unvalidated Requests│ 2      │
│ Schema Coverage (%) │ 80.00% │
└─────────────────────┴────────┘
```

### Example Postman Script with AJV Validation

![ajv](https://github.com/dreamquality/postman-openapi-schema-validator/blob/main/images/ajv.png)

---

## Arguments

### CLI Arguments:

- `--collection <path>`: Path to the Postman collection JSON file.
- `--spec <path>`: Path to the OpenAPI specification file (JSON or YAML).
- `--status-code-check`: Adds status code validation to Postman tests.

### Library Options:

- `collectionPath`: Path to the Postman collection JSON file.
- `specPath`: Path to the OpenAPI specification file (JSON or YAML).
- `options.statusCodeCheck`: Enables status code validation.

---

## Logging

- **Green Checkmark (✓):** Schema found and successfully added to the Postman collection.
- **Red Cross (✗):** Schema not found or an error occurred. Details will be logged in the console.

---

## Links

- [GitHub Repository](https://github.com/dreamquality/postman-openapi-schema-validator)
- [npm Package](https://www.npmjs.com/package/postman-openapi-schema-validator)

---

### What's New in Version 1.1.1

- Added a percentage-based schema coverage report.
- Enhanced CLI error handling and user feedback.
- Improved library usage example with detailed options.
- Bug fixes and performance optimizations.
