const path = require('path');

module.exports = {
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@nodle/db': path.resolve(__dirname, './packages/db'),
            '@nodle/utils': path.resolve(__dirname, './packages/utils'),
            '@nodle/indexer': path.resolve(__dirname, './packages/indexer'),
        },
    }
}
