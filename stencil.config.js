
const { sass } = require('@stencil/sass');
const nodePolyfills = require('rollup-plugin-node-polyfills');
exports.config = {
    outputTargets: [{
        type: 'www',
      serviceWorker: null
    }],
    plugins: [
        sass({
            injectGlobalPaths: [
                'src/global/variables.scss',
            ]
        })
    ],
    rollupPlugins: {
      after: [
        nodePolyfills(),
      ]
    },
    globalScript: 'src/global/globalScript.ts',
    globalStyle: 'src/global/app.scss',
    testing: {
        allowableMismatchedPixels: 200,
        pixelmatchThreshold: 0.1,
        emulate: [{
            userAgent: 'Desktop',
            width: 1280,
            height: 800,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false
        }]
    }
};

exports.devServer = {
    root: 'www',
    watchGlob: '**/**'
};
