import path from 'path';

module.exports = {
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@omni/db': path.resolve(__dirname, './packages/db'),
            '@omni/utils': path.resolve(__dirname, './packages/utils'),
            '@omni/indexer': path.resolve(__dirname, './packages/indexer'),
            '@omni/backfiller': path.resolve(__dirname, './packages/backfiller'),
            '@omni/polkadot': path.resolve(__dirname, './packages/polkadot'),
        },
    }
}
