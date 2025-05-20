// src/actions/getPresignedUrl.ts
'use server';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

console.log("AWS_REGION:", process.env.AWS_REGION); // Add this line
console.log("AWS_BUCKET_NAME:", process.env.AWS_BUCKET_NAME); // Add this line

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getPresignedUrl(bucketName: string, objectKey: string, expires = 3600): Promise<string | undefined> {
  console.log("getPresignedUrl called with:", { bucketName, objectKey, expires }); // Existing line
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: expires });

    return presignedUrl;
  } catch (error) {
    console.error(`Error getting presigned url for object ${objectKey}:`, error);
    return undefined;
  }
}