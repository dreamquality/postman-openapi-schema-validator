const $RefParser = require('json-schema-ref-parser');

// Helper functions for OpenAPI
const normalizePath = (path) => path.replace(/(:[^/]+|{[^/]+})/g, '{}');

const matchRequestWithSchema = (postmanRequest, openapiSpec) => {
    const requestPath = `/${postmanRequest.url.path.join('/')}`;
    const normalizedRequestPath = normalizePath(requestPath);
    const requestMethod = postmanRequest.method.toLowerCase();

    const paths = Object.keys(openapiSpec.paths).map(path => ({
        original: path,
        normalized: normalizePath(path),
    }));

    for (const { original, normalized } of paths) {
        if (
            normalizedRequestPath === normalized ||
            normalizedRequestPath.startsWith(`${normalized}/`) ||
            normalized.startsWith(`${normalizedRequestPath}/`)
        ) {
            return openapiSpec.paths[original][requestMethod] || null;
        }
    }

    return null;
};

const processCollection = (postmanCollection, openapiSpec, options) => {
    const openapiVersion = openapiSpec.openapi || openapiSpec.swagger;

    const processItem = (item) => {
        const matchedSchema = matchRequestWithSchema(item.request, openapiSpec);
        if (matchedSchema) {
            // Add schema validation logic here (as in your original `addSchemaValidationTest`)
        }
    };

    const processItemsRecursively = (items) => {
        items.forEach((item) => {
            if (item.item) {
                processItemsRecursively(item.item);
            } else {
                processItem(item);
            }
        });
    };

    processItemsRecursively(postmanCollection.item);
};

module.exports = {
    processCollection,
    normalizePath,
};
