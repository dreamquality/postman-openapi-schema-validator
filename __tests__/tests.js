const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { validate } = require('./../src');

// CLI Tests
describe('CLI Tests', () => {
    const testDataPath = path.resolve(__dirname, 'data');
    const outputFilePath = path.join(testDataPath, 'postman-collection_with_validation.json');

    beforeAll(() => {
        // Удаляем выходной файл перед запуском тестов
        if (fs.existsSync(outputFilePath)) {
            fs.unlinkSync(outputFilePath);
        }
    });

    test('should display version', () => {
        const output = execSync('node cli.js --version').toString();
        expect(output.trim()).toBe('postman-openapi-schema-validator version: 1.1.0');
    });

    test('should display help', () => {
        const output = execSync('node cli.js --help').toString();
        expect(output).toMatch(/Usage:/);
        expect(output).toMatch(/--collection/);
        expect(output).toMatch(/--spec/);
    });

    test('should fail if required arguments are missing', () => {
        expect(() => execSync('node cli.js')).toThrow();
    });

    test('should create a Postman collection with validation by provided OpenAPI', () => {
        const testDataPath = path.resolve(__dirname, 'data'); // Убедитесь, что путь ведет к правильной папке
        const outputFilePath = path.resolve(__dirname, '../postman-collection_with_validation.json');
    
        // Убедимся, что файл не существует перед тестом
        if (fs.existsSync(outputFilePath)) {
            fs.unlinkSync(outputFilePath);
        }
    
        // Выполняем команду CLI
        execSync(
            `node cli.js --collection ${path.join(
                testDataPath,
                'postman-collection.json'
            )} --spec ${path.join(testDataPath, 'test-swagger.json')}`,
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
                `node cli.js --collection ${path.join(
                    testDataPath,
                    'postman-collection.json'
                )} --spec ${path.join(testDataPath, 'invalid-swagger.json')}`,
                { stdio: 'pipe' }
            )
        ).toThrow();
    });
});

// Validate Function Tests
describe('Validate Function Tests', () => {
    const testDataPath = path.resolve(__dirname, 'data');
    const mockOptions = {
        collectionPath: path.join(testDataPath, 'postman-collection.json'),
        specPath: path.join(testDataPath, 'test-swagger.json'),
        outputDir: testDataPath,
        options: { statusCodeCheck: true },
    };

    test('should validate Postman collection with OpenAPI and save output', async () => {
        const outputFilePath = path.join('postman-collection_with_validation.json');
    
        // Убедимся, что файл не существует перед тестом
        if (fs.existsSync(outputFilePath)) {
            fs.unlinkSync(outputFilePath);
        }
    
        // Выполняем функцию validate
        const result = await validate(mockOptions);
    
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
