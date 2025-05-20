// generate-metadata.ts
import { readdir, writeFile,readFile, stat } from 'fs/promises';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

async function generateMetadata() {
  const contentTypes = await readdir(uploadsDir);

  for (const contentType of contentTypes) {
    const contentTypeDir = path.join(uploadsDir, contentType);
    const stats = await stat(contentTypeDir); // Check if it's a directory

    if (stats.isDirectory()) { // Only process directories
      const files = await readdir(contentTypeDir);
      const pdfFiles = files.filter(file => file.endsWith('.pdf'));

      for (const pdfFile of pdfFiles) {
        const fileId = pdfFile.split('.')[0];
        const metadataFile = path.join(contentTypeDir, `${fileId}.json`);

        try {
          await readFile(metadataFile);
          console.log(`Metadata already exists for ${fileId} in ${contentType}`);
        } catch (error) {
          const title = fileId.replace(/-/g, ' ');
          const metadata = { title };
          await writeFile(metadataFile, JSON.stringify(metadata, null, 2));
          console.log(`Generated metadata for ${fileId} in ${contentType}`);
        }
      }
    }
  }
}

generateMetadata();