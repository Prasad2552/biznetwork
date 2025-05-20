
//src\app\api\upload-pdf\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Channel from '@/lib/models/Channel';
import { slugify } from '@/utils/slugify';
import { Types } from 'mongoose';
import PDF from '@/lib/models/PDF';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import CloudConvert from 'cloudconvert';
import { Readable } from 'stream';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

// Type mapping
const contentTypesMap = {
  'e-books': { model: PDF },
  'infographics': { model: PDF },
  'case-studies': { model: PDF },
  'white-papers': { model: PDF },
} as const;

type ContentType = keyof typeof contentTypesMap;

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY!);

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = ['application/pdf'];

async function uploadFileToS3(file: File, folder: string, identifier: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const uniqueId = uuidv4();
  const fileName = `${slugify(file.name.replace(/\.[^/.]+$/, ''))}-${uniqueId}.${fileExtension}`;
  const key = `${folder}/${identifier}/${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const featureImage = formData.get('featureImage') as File | null;
    const title = formData.get('title') as string | null;
    const channelId = formData.get('channelId') as string | null;
    const description = formData.get('description') as string | null;
    const author = formData.get('author') as string | undefined;
    const contentType = formData.get('contentType') as string | null;

    if (!file || !contentType || !title || !channelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 });
    }

    if (featureImage && (!ALLOWED_IMAGE_TYPES.includes(featureImage.type) || featureImage.size > MAX_IMAGE_SIZE)) {
      return NextResponse.json({ error: 'Invalid feature image' }, { status: 400 });
    }

    const normalizedContentType = contentType.toLowerCase();
    if (!(normalizedContentType in contentTypesMap)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const pdfContentType = normalizedContentType as ContentType;
    const slug = slugify(title);

    const fileUrl = await uploadFileToS3(file, 'pdfs', channelId);
    const featureImageUrl = featureImage
      ? await uploadFileToS3(featureImage, 'feature-images', channelId)
      : null;

    // Upload file to CloudConvert
    const uploadTask = await cloudConvert.tasks.create('import/upload');

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    await cloudConvert.tasks.upload(uploadTask, stream, file.name);

    // Convert to HTML
    const convertTask = await cloudConvert.tasks.create('convert', {
      input: uploadTask.id,
      output_format: 'html',
      embed_images: true,
    });

    await cloudConvert.tasks.wait(convertTask.id);

    // Export to URL
    const exportTask = await cloudConvert.tasks.create('export/url', {
      input: convertTask.id,
    });

    const completedExportTask = await cloudConvert.tasks.wait(exportTask.id);
    const files = completedExportTask.result?.files;

    if (!files || !files.length || !files[0]?.url) {
      throw new Error('Failed to retrieve converted HTML URL');
    }

    const htmlUrl = files[0].url;
    const htmlResponse = await fetch(htmlUrl);
    const htmlContent = await htmlResponse.text();

    const htmlKey = `pdfs/${channelId}/${slug}/index.html`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: htmlKey,
        Body: htmlContent,
        ContentType: 'text/html',
      })
    );

    const contentUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${htmlKey}`;

    const newContent = new contentTypesMap[pdfContentType].model({
      channelId: new Types.ObjectId(channelId),
      title,
      description,
      filePath: fileUrl,
      featureImageUrl,
      author,
      contentType: pdfContentType,
      status: 'draft',
      slug,
      fileUrl,
      content: contentUrl,
    });

    await newContent.save();

    // Increment count
    let countField: string;
    switch (pdfContentType) {
      case 'e-books':
        countField = 'ebookCount';
        break;
      case 'infographics':
        countField = 'infographicCount';
        break;
      case 'case-studies':
        countField = 'CaseStudiesCount';
        break;
      case 'white-papers':
        countField = 'whitePaperCount';
        break;
      default:
        return NextResponse.json({ error: 'Invalid content type for count' }, { status: 400 });
    }

    await Channel.findByIdAndUpdate(channelId, { $inc: { [countField]: 1 } });

    return NextResponse.json({ contentId: newContent._id, title, channelId, contentUrl }, { status: 201 });
  } catch (error) {
    console.error('Error in PDF upload:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
