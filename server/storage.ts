import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

const externalRuntime = () => ENV.runtime === "external";
const normalizeKey = (relKey: string) => relKey.replace(/^\/+/, "");
const appendHashSuffix = (relKey: string) => {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const dot = relKey.lastIndexOf(".");
  return dot === -1 ? `${relKey}_${hash}` : `${relKey.slice(0, dot)}_${hash}${relKey.slice(dot)}`;
};

function r2Client() {
  if (!ENV.r2Endpoint || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey || !ENV.r2Bucket) {
    throw new Error("R2 não está configurado. Defina R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET.");
  }
  return new S3Client({ region: "auto", endpoint: ENV.r2Endpoint, credentials: { accessKeyId: ENV.r2AccessKeyId, secretAccessKey: ENV.r2SecretAccessKey } });
}

function forgeConfig() {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) throw new Error("Storage Forge não está configurado.");
  return { forgeUrl: ENV.forgeApiUrl.replace(/\/+$/, ""), forgeKey: ENV.forgeApiKey };
}

export async function storagePut(relKey: string, data: Buffer | Uint8Array | string, contentType = "application/octet-stream"): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  if (externalRuntime()) {
    const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    await r2Client().send(new PutObjectCommand({ Bucket: ENV.r2Bucket, Key: key, Body: body, ContentType: contentType }));
    if (!ENV.r2PublicBaseUrl) throw new Error("R2_PUBLIC_BASE_URL é necessária para exibir as mídias no aplicativo.");
    return { key, url: `${ENV.r2PublicBaseUrl}/${key}` };
  }
  const { forgeUrl, forgeKey } = forgeConfig();
  const presignUrl = new URL("v1/storage/presign/put", `${forgeUrl}/`);
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, { headers: { Authorization: `Bearer ${forgeKey}` } });
  if (!presignResp.ok) throw new Error(`Storage presign falhou (${presignResp.status}).`);
  const { url } = await presignResp.json() as { url: string };
  const upload = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: typeof data === "string" ? data : Buffer.from(data) });
  if (!upload.ok) throw new Error(`Upload de arquivo falhou (${upload.status}).`);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (externalRuntime() && ENV.r2PublicBaseUrl) return { key, url: `${ENV.r2PublicBaseUrl}/${key}` };
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  if (externalRuntime()) return getSignedUrl(r2Client(), new GetObjectCommand({ Bucket: ENV.r2Bucket, Key: key }), { expiresIn: 900 });
  const { forgeUrl, forgeKey } = forgeConfig();
  const getUrl = new URL("v1/storage/presign/get", `${forgeUrl}/`);
  getUrl.searchParams.set("path", key);
  const response = await fetch(getUrl, { headers: { Authorization: `Bearer ${forgeKey}` } });
  if (!response.ok) throw new Error(`URL assinada falhou (${response.status}).`);
  return (await response.json() as { url: string }).url;
}
