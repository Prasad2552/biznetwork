// pdfjs-alias.js
export default () => {
  if (typeof process !== 'undefined' && process.release?.name === 'node') {
      try {
          // Attempt to import pdfjs-dist dynamically if in a Node.js environment
          return import('pdfjs-dist/build/pdf.js')
              .then(pdfjs => {
                  console.log('pdfjs-dist loaded successfully.');
                  return pdfjs; // Return the module
              })
              .catch(error => {
                  console.error('Error loading pdfjs-dist:', error);
                  return {}; // Return an empty object if import fails
              });
      } catch (err) {
          console.error("Failed to load pdfjs-dist:", err);
           return {}; // Return an empty object if import fails
      }
  }

  return {};
};