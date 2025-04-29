export const extractS3BucketAndKeyFromUrl = (
  path: string,
): { bucket?: string; key?: string; url?: string } => {
  const urlObj = new URL(path);
  const hostname = urlObj.hostname;

  const bucket = hostname.split('.s3.')[0];
  const key = urlObj.pathname.substring(1);

  if (!bucket && !key) {
    return { url: path };
  }

  return {
    bucket,
    key,
  };
};
