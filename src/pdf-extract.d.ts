// src/pdf-extract.d.ts
declare module 'pdf-extract' {
    interface ExtractOptions {
        type?: 'text';
    }
    function extract(
       pdfBuffer: Buffer,
      options: ExtractOptions,
      callback: (err: Error | null, data: {text: string} | null) => void
  ):void;
 
   export { extract, ExtractOptions };
 }