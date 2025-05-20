(function() {
    var originalOnError = window.onerror;
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      if (url.includes('ad_status.js')) {
        console.warn('Ignored error from ad_status.js');
        return true;
      }
      if (originalOnError) {
        return originalOnError(msg, url, lineNo, columnNo, error);
      }
      return false;
    };
  })();
  
  