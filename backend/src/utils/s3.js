import fs from "fs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export function isS3Enabled() {
  return process.env.USE_S3_UPLOADS === "true" && Boolean(process.env.AWS_S3_BUCKET);
}

export function getS3Client() {
  return new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
}

export async function uploadFileToS3(file) {
  const bucket = process.env.AWS_S3_BUCKET;
  const key = `marineprocure/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const body = fs.createReadStream(file.path);

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: file.mimetype
    })
  );

  fs.unlink(file.path, () => {});

  return {
    storedName: key,
    fileUrl: `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`
  };
}
