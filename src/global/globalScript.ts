
try{

  /**
   * ion-icon svg fetch fails because 'stencil-electron' schema is not supported.
   *
   * https://github.com/ionic-team/ionicons/issues/572#issuecomment-403304190
   */
  function ssrFetchWorkaround() {
    const originalFetch = (window as any).fetch;

    (window as any).fetch = (...args) => {
      const [url] = args;

      if (typeof url === 'string' && url.match(/\.svg/)) {
        return new Promise((resolve, reject) => {
          const req = new XMLHttpRequest();
          req.open('GET', url, true);
          req.addEventListener('load', () => {
            resolve({ok: true, text: () => Promise.resolve(req.responseText)});
          });
          req.addEventListener('error', reject);
          req.send();
        });
      } else {
        return originalFetch(...args);
      }
    };
  }

  ssrFetchWorkaround();
}
catch(e){
  console.warn(e);
}


