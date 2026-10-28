export function duplicateUpload(error) {
  return (
    String(error?.statusCode || error?.status) === '409' ||
    error?.error === 'Duplicate' ||
    ['ResourceAlreadyExists', 'KeyAlreadyExists', 'AssetAlreadyExists'].includes(error?.code) ||
    (String(error?.statusCode || error?.status) === '400' &&
      /^(asset already exists|the resource already exists)[.!]?$/i.test(error?.message || ''))
  );
}
async function sameFile(a, b) {
  if (a.size !== b.size) return false;
  const digest = async (file) =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()));
  const x = await digest(a),
    y = await digest(b);
  return x.every((value, i) => value === y[i]);
}
export async function uploadPendingFile(bucket, photo, file, active) {
  if (!active())
    throw Object.assign(Error('A conta mudou. Retome o envio na conta original.'), {
      code: 'SESSION_REQUIRED',
    });
  const result = await bucket.upload(photo.storage_path, file, {
    upsert: false,
    contentType: file.type || 'image/jpeg',
  });
  if (!result.error) return;
  if (!duplicateUpload(result.error)) throw result.error;
  if (!active())
    throw Object.assign(Error('A conta mudou. Retome o envio na conta original.'), {
      code: 'SESSION_REQUIRED',
    });
  const existing = await bucket.download(photo.storage_path);
  if (existing.error) throw existing.error;
  if (!(await sameFile(existing.data, file)))
    throw Object.assign(
      Error('A foto do servidor difere da foto local. Os dados foram preservados para revisão.'),
      { code: 'LOCAL_FILE_CONFLICT' },
    );
}
