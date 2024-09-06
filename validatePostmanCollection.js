const fs = require('fs');
const path = require('path');
const JSON5 = require('json5'); // Исправлено: импортируем JSON5 модуль

// Получение аргументов командной строки
const args = process.argv.slice(2);
console.log('Arguments:', args); // Вывод аргументов для отладки

const collectionArgIndex = args.indexOf('--collection');

if (collectionArgIndex === -1 || !args[collectionArgIndex + 1]) {
    console.error('Usage: node validatePostmanCollection.js --collection <path_to_collection>');
    process.exit(1);
}

const collectionPath = args[collectionArgIndex + 1];

// Функция для чтения файла JSON
function readFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.json') {
        throw new Error('Unsupported file format. Please provide a JSON file.');
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    try {
        JSON5.parse(fileContents); // Проверка синтаксиса JSON
    } catch (e) {
        console.error(`JSON Syntax Error in file ${filePath}: ${e.message}`);
        if (e.lineNumber && e.column) {
            console.error(`Error Location: Line ${e.lineNumber}, Column ${e.column}`);
        }
        process.exit(1);
    }

    try {
        return JSON.parse(fileContents);
    } catch (e) {
        console.error(`JSON Parsing Error in file ${filePath}: ${e.message}`);
        process.exit(1);
    }
}

// Чтение Postman коллекции
let postmanCollection;
try {
    postmanCollection = readFile(collectionPath);
    if (!postmanCollection.item || !Array.isArray(postmanCollection.item)) {
        throw new Error('Invalid Postman collection format. The "item" property is either missing or not an array.');
    }
    console.log('Postman collection is valid.');
} catch (error) {
    console.error(`Error processing Postman collection: ${error.message}`);
    if (error.message.includes('Invalid Postman collection format')) {
        console.error('Ensure that your Postman collection includes an "item" property that is an array.');
    } else {
        console.error('An unexpected error occurred:', error);
    }
    process.exit(1);
}
