declare module 'pdftohtmljs' {
    interface Converter {
      convert(preset: string): Promise<void>;
    }
    function pdftohtml(pdfPath: string, htmlPath: string): Converter;
    export = pdftohtml;
  }