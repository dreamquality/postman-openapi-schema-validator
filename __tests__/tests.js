const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { validateCollection } = require('./../src');

// CLI Tests
describe('CLI Tests', () => {
    const testDataPath = path.resolve(__dirname, '../data');
    const outputFilePath = path.join(testDataPath, '../postman-collection_with_validation.json');

    beforeAll(() => {
        // Удаляем выходной файл перед запуском тестов
        if (fs.existsSync(outputFilePath)) {
            fs.unlinkSync(outputFilePath);
        }
    });

    test('should display version', () => {
        const output = execSync('node src/index.js --version').toString();
        expect(output.trim()).toBe('postman-openapi-schema-validator version: 1.1.1');
    });

    test('should display help', () => {
        const output = execSync('node src/index.js --help').toString();
        expect(output).toMatch(/Usage:/);
        expect(output).toMatch(/--collection/);
        expect(output).toMatch(/--spec/);
    });

    test('should fail if required arguments are missing', () => {
        expect(() => execSync('node src/index.js')).toThrow();
    });

    test('should create a Postman collection with validation by provided OpenAPI', () => {

        execSync(
            `node src/index.js --collection __tests__/data/postman-collection.json --spec __tests__/data/test-swagger.json`,
            { stdio: 'inherit' }
        );
    
        // Проверяем, что файл был создан
        expect(fs.existsSync(outputFilePath)).toBe(true);
    
        // Проверяем содержимое сгенерированного файла
        const generatedCollection = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
        expect(generatedCollection).toHaveProperty('item');
        expect(generatedCollection.item).not.toHaveLength(0);
    
        // Удаляем файл после теста
        fs.unlinkSync(outputFilePath);
    });
    
    
    test('should fail validation with invalid OpenAPI spec', () => {
        expect(() =>
            execSync(
                `node src/index.js --collection ${path.join(
                    testDataPath,
                    'postman-collection.json'
                )} --spec ${path.join(testDataPath, 'invalid-swagger.json')}`,
                { stdio: 'pipe' }
            )
        ).toThrow();
    });

    test('should create a Postman collection with validation using OpenAPI 3.1', () => {
        const outputFilePath = path.join(testDataPath, '../postman-collection-3.1_with_validation.json');

        // Clean up before test
        if (fs.existsSync(outputFilePath)) {
            fs.unlinkSync(outputFilePath);
        }

        execSync(
            `node src/index.js --collection __tests__/data/postman-collection-3.1.json --spec __tests__/data/test-openapi-3.1.json`,
            { stdio: 'inherit' }
        );

        // Check that the file was created
        expect(fs.existsSync(outputFilePath)).toBe(true);

        // Check contents of generated file
        const generatedCollection = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
        expect(generatedCollection).toHaveProperty('item');
        expect(generatedCollection.item).not.toHaveLength(0);

        // Verify that validation tests were added
        const hasValidationTests = generatedCollection.item.some(item => 
            item.event && item.event.some(event => 
                event.listen === 'test' && 
                event.script.exec.some(line => line.includes('Schema validation'))
            )
        );
        expect(hasValidationTests).toBe(true);

        // Clean up after test
        fs.unlinkSync(outputFilePath);
    });
});

describe('Validate Function Tests', () => {
    const testDataPath = path.resolve(__dirname, 'data');
    const collectionPath = path.join(testDataPath, 'postman-collection.json');
    const specPath = path.join(testDataPath, 'test-swagger.json');
    const options = { statusCodeCheck: true };

    test('should validate Postman collection with OpenAPI and save output', async () => {
        const outputFilePath = path.join('postman-collection_with_validation.json');
    
        // Убедимся, что файл не существует перед тестом
        if (fs.existsSync(outputFilePath)) {
            fs.unlinkSync(outputFilePath);
        }
    
        // Выполняем функцию validateCollection
        const result = await validateCollection(collectionPath, specPath, options);
    
        expect(result).toBe(outputFilePath); // Проверяем, что возвращённый путь совпадает с ожидаемым
        expect(fs.existsSync(result)).toBe(true); // Проверяем, что файл существует
    
        // Проверяем содержимое сгенерированного файла
        const generatedCollection = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
        expect(generatedCollection).toHaveProperty('item');
        expect(generatedCollection.item).not.toHaveLength(0);
    
        // Удаляем файл после теста
        fs.unlinkSync(outputFilePath);
    });
});

describe('OpenAPI 3.1 Support Tests', () => {
    const testDataPath = path.resolve(__dirname, 'data');
    const collection31Path = path.join(testDataPath, 'postman-collection-3.1.json');
    const spec31Path = path.join(testDataPath, 'test-openapi-3.1.json');
    const options = { statusCodeCheck: true };

    test('should detect OpenAPI 3.1.0 version', async () => {
        const outputFilePath = path.join('postman-collection-3.1_with_validation.json');
        
        // Clean up before test
        if (fs.existsSync(outputFilePath)) {
            fs.unlinkSync(outputFilePath);
        }

        // Capture console output to check version detection
        const originalLog = console.log;
        let logOutput = '';
        console.log = (message) => {
            logOutput += message + '\n';
            originalLog(message);
        };

        try {
            const result = await validateCollection(collection31Path, spec31Path, options);
            
            expect(logOutput).toContain('OpenAPI version detected: 3.1.0');
            expect(result).toBe(outputFilePath);
            expect(fs.existsSync(result)).toBe(true);

            // Verify generated collection has validation tests
            const generatedCollection = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
            expect(generatedCollection).toHaveProperty('item');
            expect(generatedCollection.item).not.toHaveLength(0);

            // Check that at least one item has validation tests
            const hasValidationTests = generatedCollection.item.some(item => 
                item.event && item.event.some(event => 
                    event.listen === 'test' && 
                    event.script.exec.some(line => line.includes('Schema validation'))
                )
            );
            expect(hasValidationTests).toBe(true);

        } finally {
            console.log = originalLog;
            if (fs.existsSync(outputFilePath)) {
                fs.unlinkSync(outputFilePath);
            }
        }
    });

    test('should handle OpenAPI 3.1 specific features', async () => {
        const outputFilePath = path.join('postman-collection-3.1_with_validation.json');
        
        // Clean up before test
        if (fs.existsSync(outputFilePath)) {
            fs.unlinkSync(outputFilePath);
        }

        try {
            const result = await validateCollection(collection31Path, spec31Path, options);
            
            const generatedCollection = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
            
            // Find a test script that includes the schema
            const testItem = generatedCollection.item.find(item => 
                item.event && item.event.some(event => 
                    event.listen === 'test' && 
                    event.script.exec.some(line => line.includes('const schema ='))
                )
            );
            
            expect(testItem).toBeDefined();
            
            // Extract the schema from the test script
            const testEvent = testItem.event.find(event => event.listen === 'test');
            const schemaLine = testEvent.script.exec.find(line => line.includes('const schema ='));
            
            // The schema should be valid JSON
            const schemaMatch = schemaLine.match(/const schema = (.*);$/);
            expect(schemaMatch).toBeTruthy();
            
            const schema = JSON.parse(schemaMatch[1]);
            expect(schema).toBeDefined();
            expect(typeof schema).toBe('object');

        } finally {
            if (fs.existsSync(outputFilePath)) {
                fs.unlinkSync(outputFilePath);
            }
        }
    });
});