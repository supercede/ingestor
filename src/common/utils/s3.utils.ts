export const extractS3BucketAndKeyFromUrl = (
  s3Path: string,
): { bucket: string; key: string } => {
  const urlObj = new URL(s3Path);
  const hostname = urlObj.hostname;

  const bucket = hostname.split('.s3.')[0];
  const key = urlObj.pathname.substring(1);

  return {
    bucket,
    key,
  };
};
