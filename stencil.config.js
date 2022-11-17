const {sass} = require('@stencil/sass');
exports.config = {
  outputTargets: [{
    type: 'www',
    baseUrl:'http://piwotworki',
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
