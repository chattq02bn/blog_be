import { Request } from "express";
import busboy from "busboy";
import { v2 as cloudinary } from "cloudinary";
import { Storage } from "megajs";
import { prisma } from "../config/prisma.js";

/* ───────── Upload config keys in site_configs ───────── */

const UPLOAD_KEYS = {
  CLOUDINARY_CLOUD_NAME: "upload_cloudinary_cloud_name",
  CLOUDINARY_API_KEY: "upload_cloudinary_api_key",
  CLOUDINARY_API_SECRET: "upload_cloudinary_api_secret",
  CLOUDINARY_FOLDER: "upload_cloudinary_folder",
  MEGA_EMAIL: "upload_mega_email",
  MEGA_PASSWORD: "upload_mega_password",
} as const;

export interface UploadConfig {
  cloudinary: { cloudName: string; apiKey: string; apiSecret: string; folder: string };
  mega: { email: string; password: string };
}

export async function getUploadConfig(): Promise<UploadConfig> {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: Object.values(UPLOAD_KEYS) } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    cloudinary: {
      cloudName: map[UPLOAD_KEYS.CLOUDINARY_CLOUD_NAME] ?? "",
      apiKey: map[UPLOAD_KEYS.CLOUDINARY_API_KEY] ?? "",
      apiSecret: map[UPLOAD_KEYS.CLOUDINARY_API_SECRET] ?? "",
      folder: map[UPLOAD_KEYS.CLOUDINARY_FOLDER] ?? "blog",
    },
    mega: {
      email: map[UPLOAD_KEYS.MEGA_EMAIL] ?? "",
      password: map[UPLOAD_KEYS.MEGA_PASSWORD] ?? "",
    },
  };
}

export async function updateUploadConfig(input: UploadConfig): Promise<UploadConfig> {
  await Promise.all([
    prisma.siteConfig.upsert({
      where: { key: UPLOAD_KEYS.CLOUDINARY_CLOUD_NAME },
      update: { value: input.cloudinary.cloudName },
      create: { key: UPLOAD_KEYS.CLOUDINARY_CLOUD_NAME, value: input.cloudinary.cloudName },
    }),
    prisma.siteConfig.upsert({
      where: { key: UPLOAD_KEYS.CLOUDINARY_API_KEY },
      update: { value: input.cloudinary.apiKey },
      create: { key: UPLOAD_KEYS.CLOUDINARY_API_KEY, value: input.cloudinary.apiKey },
    }),
    prisma.siteConfig.upsert({
      where: { key: UPLOAD_KEYS.CLOUDINARY_API_SECRET },
      update: { value: input.cloudinary.apiSecret },
      create: { key: UPLOAD_KEYS.CLOUDINARY_API_SECRET, value: input.cloudinary.apiSecret },
    }),
    prisma.siteConfig.upsert({
      where: { key: UPLOAD_KEYS.CLOUDINARY_FOLDER },
      update: { value: input.cloudinary.folder },
      create: { key: UPLOAD_KEYS.CLOUDINARY_FOLDER, value: input.cloudinary.folder },
    }),
    prisma.siteConfig.upsert({
      where: { key: UPLOAD_KEYS.MEGA_EMAIL },
      update: { value: input.mega.email },
      create: { key: UPLOAD_KEYS.MEGA_EMAIL, value: input.mega.email },
    }),
    prisma.siteConfig.upsert({
      where: { key: UPLOAD_KEYS.MEGA_PASSWORD },
      update: { value: input.mega.password },
      create: { key: UPLOAD_KEYS.MEGA_PASSWORD, value: input.mega.password },
    }),
  ]);
  return input;
}

/* ───────── Upload logic ───────── */

let _megaStorage: Storage | null = null;

async function getMegaStorage(email: string, password: string): Promise<Storage> {
  if (!_megaStorage) {
    _megaStorage = await new Storage({ email, password }).ready;
  }
  return _megaStorage;
}

export interface UploadResult {
  url: string;
  bytes: number;
  format: string;
  originalFilename: string;
}

export async function handleFileUpload(req: Request): Promise<UploadResult> {
  const config = await getUploadConfig();

  return new Promise<UploadResult>((resolve, reject) => {
    const bb = busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: 50 * 1024 * 1024 },
    });

    bb.on("file", (_fieldname, stream, info) => {
      const { filename, mimeType } = info;
      const isMedia = mimeType?.startsWith("image") || mimeType?.startsWith("video");

      if (isMedia && config.cloudinary.cloudName) {
        /* ── Cloudinary: pipe trực tiếp, KHÔNG buffer ── */
        cloudinary.config({
          cloud_name: config.cloudinary.cloudName,
          api_key: config.cloudinary.apiKey,
          api_secret: config.cloudinary.apiSecret,
        });

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: config.cloudinary.folder || "blog",
            use_filename: true,
            unique_filename: false,
            resource_type: mimeType?.startsWith("video") ? "video" : "image",
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("No result from Cloudinary"));
            resolve({
              url: result.secure_url,
              bytes: result.bytes,
              format: result.format,
              originalFilename: filename ?? "unknown",
            });
          },
        );

        /* Pipe trực tiếp — busboy stream → Cloudinary */
        stream.pipe(uploadStream);
        stream.on("error", (e) => uploadStream.destroy(e));

      } else if (config.mega.email && config.mega.password) {
        /* ── Mega: phải collect buffer (mega không hỗ trợ pipe) ── */
        const chunks: Buffer[] = [];
        let totalBytes = 0;

        stream.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
          totalBytes += chunk.length;
        });

        stream.on("end", async () => {
          try {
            const mega = await getMegaStorage(config.mega.email, config.mega.password);
            const megaStream = mega.upload({
              name: filename ?? "unknown",
              size: totalBytes,
            });

            (megaStream as unknown as NodeJS.WritableStream).end(Buffer.concat(chunks));

            megaStream.on("complete", (megaFile) => {
              megaFile.link(false, (linkErr, url) => {
                if (linkErr) return reject(linkErr);
                resolve({
                  url: url ?? "",
                  bytes: totalBytes,
                  format: mimeType ?? "application/octet-stream",
                  originalFilename: filename ?? "unknown",
                });
              });
            });

            megaStream.on("error", reject);
          } catch (e) {
            reject(e);
          }
        });

        stream.on("error", reject);

      } else {
        stream.resume();
        reject(new Error("No upload provider configured"));
      }
    });

    bb.on("error", reject);
    req.pipe(bb);
  });
}
