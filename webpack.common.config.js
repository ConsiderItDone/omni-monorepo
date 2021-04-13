import path from 'path';

module.exports = {
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@nodle/db': path.resolve(__dirname, './packages/db'),
            '@nodle/utils': path.resolve(__dirname, './packages/utils'),
            '@nodle/indexer': path.resolve(__dirname, './packages/indexer'),
            '@nodle/backfiller': path.resolve(__dirname, './packages/backfiller'),
            '@nodle/polkadot': path.resolve(__dirname, './packages/polkadot'),
        },
    }
}
