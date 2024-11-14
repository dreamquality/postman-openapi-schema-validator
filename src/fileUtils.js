const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const readFile = async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const fileContents = fs.readFileSync(filePath, 'utf8');

    try {
        if (ext === '.json') {
            return JSON.parse(fileContents);
        } else if (ext === '.yaml' || ext === '.yml') {
            return yaml.load(fileContents);
        } else {
            throw new Error('Unsupported file format. Please provide a JSON or YAML file.');
        }
    } catch (error) {
        throw new Error(`Error reading file ${filePath}: ${error.message}`);
    }
};

const writeFile = async (filePath, content) => {
    await fs.promises.writeFile(filePath, JSON.stringify(content, null, 2));
};

module.exports = {
    readFile,
    writeFile,
};
