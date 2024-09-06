```sh {"id":"01J73FT4D7JV942WRGYB4AKRH6"}
# OpenAPI to Postman Schema Validator

This project provides a Node.js script to automate the process of validating 
Postman request responses against OpenAPI (Swagger) schemas. 
It reads OpenAPI specifications (in JSON or YAML format) and Postman collections 
(in JSON format), and then inserts schema validation scripts into the Postman 
collection based on the OpenAPI definitions.

## Features

- Supports OpenAPI versions 2.0, 3.0.0, 3.0.1, and higher.
- Automatically adds schema validation scripts to Postman requests.
- Logs validation results in the console for easy debugging.
- Generates a new Postman collection with added schema validation.
- Uses AJV to validate responses.
- Doesn't change your previus tests, but add new.
- Automaticly can add checks for status code based on provided OpenApi(Swagger).

## Requirements

- Node.js (version 14.x or later)
- NPM (version 6.x or later)

## Installation

1. Clone the repository:

    git clone https://github.com/dreamquality/postman-openapi-schema-validator.git


2. Install the required dependencies:

    npm install

## Usage

To run the script, use the following command:
```

```sh {"id":"01J740AAFK13C68VQ1BSH467X6"}
npm run transform -- --collection path/to/postman_collection.json --spec path/to/openapi_spec.yaml
```

To run the script with additional checks for status code, use the next command:

```sh {"id":"01J740CPH0ZGSHGQR03RAESSE7"}
npm run transform -- --collection path/to/postman_collection.json --spec path/to/openapi_spec.yaml --status-code-check

```

## Console report

![console](https://github.com/dreamquality/postman-openapi-schema-validator/blob/main/images/console.png)


## Postman update in post response script with AJV

![ajv](https://github.com/dreamquality/postman-openapi-schema-validator/blob/main/images/ajv.png)

Arguments
--collection <path_to_collection>: Path to the Postman collection JSON file.
--spec <path_to_openapi_spec>: Path to the OpenAPI specification file (JSON or YAML).

```sh {"id":"01J73FWJXCWD7HATF3RPKNT4CE"}
node tranform.js -- --collection postman_collection.json --spec openapi.yaml
```

This command reads the postman_collection.json file and openapi.yaml file, then updates the Postman collection with schema validation scripts based on the OpenAPI specification.

Logging
Green Checkmark (✓): Schema found and successfully added to the Postman collection.
Red Cross (✗): Schema not found or error encountered. Details will be logged in the console.