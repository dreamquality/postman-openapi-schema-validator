const $RefParser = require('json-schema-ref-parser');
const { readFile, writeFile } = require('./fileUtils');
const { processCollection } = require('./validation');
const path = require('path');

const validate = async ({ collectionPath, specPath, options = {} }) => {
    const collection = await readFile(collectionPath);
    const spec = await $RefParser.dereference(specPath);

    processCollection(collection, spec, options);

    const outputFileName = path.join(`${path.basename(collectionPath, path.extname(collectionPath))}_with_validation.json`);
    await writeFile(outputFileName, collection);

    return outputFileName;
};

module.exports = {
    validate,
};
