const pdftohtml = require('pdftohtmljs');
const converter = pdftohtml('sample.pdf', 'output.html');
converter.convert('ipad').then(() => console.log('Conversion done')).catch(err => console.error(err));