![npm](https://img.shields.io/npm/v/postman-openapi-schema-validator?color=blue&label=npm&logo=npm)


# OpenAPI to Postman Schema Validator

This project provides a Node.js command-line utility for automating the validation of Postman request responses against OpenAPI (Swagger) schemas. The utility reads OpenAPI specifications (in JSON or YAML format) and Postman collections (in JSON format), then inserts schema validation scripts into the Postman collection based on OpenAPI definitions. Ensure that your OpenAPI specifications contain schemas, as empty schemas won't be added.

## Features

- Supports OpenAPI versions 2.0, 3.0.0, 3.0.1, and higher.
- Automatically adds schema validation scripts to Postman requests.
- Logs validation results in the console for easy debugging.
- Generates a new Postman collection with added schema validation for 20X status codes.
- Uses AJV for response validation.
- Does not modify existing tests but adds new ones.
- Automatically adds status code checks based on OpenAPI (Swagger).

## Requirements

- Node.js (version 14.x or later)
- NPM (version 6.x or later)

## Benefits for QA

1) Maintains schema validation accuracy, ensuring that API contracts are always up to date.
2) Eliminates the need for manual schema validation creation in Postman.
3) Can be integrated into CI/CD before running tests, so QA engineers can focus on business logic and data states when creating automated tests.
4) Supports OpenAPI, JSON, and YAML validation.

## Installation

Install the utility globally with npm:

```sh
npm install -g postman-openapi-schema-validator
```

This makes the `posv` command available globally in the command line.

## Usage

To run the utility for validating a Postman collection against an OpenAPI specification, use the following command:

```sh
posv --collection path/to/postman_collection.json --spec path/to/openapi_spec.yaml
```

To run the utility with additional status code checks, use the following command:

```sh
posv --collection path/to/postman_collection.json --spec path/to/openapi_spec.yaml --status-code-check
```

## Console Report

![console](https://github.com/dreamquality/postman-openapi-schema-validator/blob/main/images/console.png)

## Postman Validation with AJV

![ajv](https://github.com/dreamquality/postman-openapi-schema-validator/blob/main/images/ajv.png)

## Arguments

- `--collection <path_to_collection>`: Path to the Postman collection JSON file.
- `--spec <path_to_openapi_spec>`: Path to the OpenAPI specification file (JSON or YAML).

## Logging

- Green Checkmark (✓): Schema found and successfully added to the Postman collection.
- Red Cross (✗): Schema not found or error encountered. Details will be logged in the console.
