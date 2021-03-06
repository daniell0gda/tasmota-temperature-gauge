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
  },
  devServer: {
    root: 'www',
    watchGlob: '**/**'
  }
};
