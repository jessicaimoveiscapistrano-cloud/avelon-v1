import crypto from "crypto";

export function validateMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string | undefined): boolean {
  if (!signatureHeader || !appSecret) return false;
  const [algo, receivedHash] = signatureHeader.split("=");
  if (algo !== "sha256" || !receivedHash) return false;

  const expectedHash = crypto.createHmac("sha256", appSecret).update(rawBody, "utf-8").digest("hex");
  const receivedBuffer = Buffer.from(receivedHash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}
