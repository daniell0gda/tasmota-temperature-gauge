const {sass} = require('@stencil/sass');
exports.config = {
  outputTargets: [{
    type: 'www',
    baseUrl:'http://localhost:9533',
    serviceWorker: null
  }],

  plugins: [
    sass({
      injectGlobalPaths: [
        'src/global/variables.scss',
      ]
    })
  ],
  globalScript: 'src/global/globalScript.ts',
  globalStyle: 'src/global/app.scss',
  devServer: {
    root: 'www',
    watchGlob: '**/**'
  }
};
