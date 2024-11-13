const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

test('should display version', () => {
    const output = execSync('node transform.js --version').toString();
    expect(output.trim()).toBe('postman-openapi-schema-validator version: 1.0.2');
});

test('should display help', () => {
    const output = execSync('node transform.js --help').toString();
    expect(output).toMatch(/Usage:/);
    expect(output).toMatch(/--collection/);
    expect(output).toMatch(/--spec/);
});

test('should fail if required arguments are missing', () => {
    expect(() => execSync('node transform.js')).toThrow();
});

test('should create a Postman collection with validation by provided OpenAPI', () => {
    const outputFilePath = path.resolve(
        __dirname,
        '../dist/postman-collection_with_validation.json'
    );

    // Ensure the output file does not exist before the test
    if (fs.existsSync(outputFilePath)) {
        fs.unlinkSync(outputFilePath);
    }

    // Run the CLI command
    execSync(
        'node transform.js --collection __tests__/postman-collection.json --spec __tests__/test-swagger.json',
        { stdio: 'inherit' }
    );

    // Check if the output file was created
    expect(fs.existsSync(outputFilePath)).toBe(true);

    // Optional: Validate the content of the generated file
    const generatedCollection = JSON.parse(
        fs.readFileSync(outputFilePath, 'utf8')
    );
    expect(generatedCollection).toHaveProperty('item');
    expect(generatedCollection.item).not.toHaveLength(0);
});

