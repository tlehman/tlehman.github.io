import {
    S3Client,
    PutObjectCommand,
    ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { timingSafeEqual } from "node:crypto";

const BUCKET = process.env.BUCKET;
const UPLOAD_KEY = process.env.UPLOAD_KEY;
const REGION = process.env.AWS_REGION;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;
const GALLERY_URL = "https://tobilehman.com/wedding/weddingpix.html";

const s3 = new S3Client({});
const ses = new SESClient({});

const ALLOWED_TYPES =
    /^(image\/(jpeg|png|gif|webp|heic|heif)|video\/(mp4|quicktime|webm))$/;
const MAX_FILES_PER_REQUEST = 30;

const resp = (statusCode, body) => ({
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

function keyValid(provided) {
    if (!UPLOAD_KEY) return false;
    const a = Buffer.from(String(provided || ""));
    const b = Buffer.from(UPLOAD_KEY);
    return a.length === b.length && timingSafeEqual(a, b);
}

export const handler = async (event) => {
    const method = event.requestContext.http.method;
    try {
        // CORS preflight: API Gateway appends the configured CORS headers
        if (method === "OPTIONS") return { statusCode: 204 };
        if (method === "GET") {
            if (!keyValid(event.queryStringParameters?.key))
                return resp(401, { error: "invalid key" });
            return await listPhotos();
        }
        if (method === "POST") {
            const body = JSON.parse(event.body || "{}");
            if (!keyValid(body.key)) return resp(401, { error: "invalid key" });
            if (body.action === "upload-urls") return await uploadUrls(body);
            if (body.action === "notify") return await notify(body);
            return resp(400, { error: "unknown action" });
        }
        return resp(405, { error: "method not allowed" });
    } catch (err) {
        console.error(err);
        return resp(500, { error: "server error" });
    }
};

async function listPhotos() {
    const photos = [];
    let token;
    do {
        const page = await s3.send(
            new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: "photos/",
                ContinuationToken: token,
            }),
        );
        for (const obj of page.Contents || []) {
            photos.push({
                key: obj.Key,
                url: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(obj.Key).replace(/%2F/g, "/")}`,
                lastModified: obj.LastModified,
                size: obj.Size,
            });
        }
        token = page.NextContinuationToken;
    } while (token);
    // Keys start with a ms timestamp, so sorting keys descending = newest first
    photos.sort((a, b) => (a.key < b.key ? 1 : -1));
    return resp(200, { photos });
}

async function uploadUrls(body) {
    const files = (body.files || []).slice(0, MAX_FILES_PER_REQUEST);
    if (!files.length) return resp(400, { error: "no files" });

    const urls = [];
    for (const file of files) {
        const type = String(file.type || "");
        if (!ALLOWED_TYPES.test(type)) {
            urls.push({ name: file.name, error: "unsupported type" });
            continue;
        }
        const safeName = String(file.name || "photo")
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .slice(0, 80);
        const rand = Math.random().toString(36).slice(2, 8);
        const key = `photos/${Date.now()}-${rand}-${safeName}`;
        const uploadUrl = await getSignedUrl(
            s3,
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                ContentType: type,
            }),
            { expiresIn: 900 },
        );
        urls.push({ name: file.name, key, uploadUrl });
    }
    return resp(200, { urls });
}

async function notify(body) {
    const uploader =
        String(body.uploader || "A guest")
            .replace(/[\r\n]/g, " ")
            .slice(0, 100) || "A guest";
    const count = Math.max(1, Math.min(1000, parseInt(body.count, 10) || 1));
    const noun = count === 1 ? "photo" : "photos";

    await ses.send(
        new SendEmailCommand({
            Source: NOTIFY_EMAIL,
            Destination: { ToAddresses: [NOTIFY_EMAIL] },
            Message: {
                Subject: {
                    Data: `📸 ${uploader} shared ${count} wedding ${noun}!`,
                },
                Body: {
                    Text: {
                        Data:
                            `${uploader} just uploaded ${count} ${noun} to your wedding gallery.\n\n` +
                            `View them here: ${GALLERY_URL}\n\n` +
                            `All photos are stored in the S3 bucket: ${BUCKET}`,
                    },
                },
            },
        }),
    );
    return resp(200, { ok: true });
}
