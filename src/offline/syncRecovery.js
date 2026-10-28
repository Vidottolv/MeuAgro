export function syncFailure(error) {
  const code = String(error?.code || error?.statusCode || error?.status || '');
  const message = error?.message || 'Falha ao enviar. Tente novamente.';
  const review =
    [
      '42501',
      '23505',
      '23514',
      'P0001',
      'PGRST202',
      '42883',
      '401',
      '403',
      'LOCAL_FILE_CONFLICT',
      'SESSION_REQUIRED',
      'SCHEMA_REQUIRED',
      '42P01',
      '42703',
      '22P02',
      '22023',
      'PGRST301',
      'PGRST303',
    ].includes(code) || ['401', '403'].includes(String(error?.status || error?.statusCode || ''));
  return { code, message, state: review ? 'review' : 'retry' };
}
export async function pendingArchive(user, operations, records, currentUser, now = Date.now) {
  let bytes = 0;
  async function encode(value) {
    if (value instanceof Blob) {
      bytes += value.size;
      if (bytes > 100 * 1024 * 1024)
        throw Error(
          'A cópia excede 100 MB. As pendências continuam preservadas neste dispositivo.',
        );
      const data = new Uint8Array(await value.arrayBuffer());
      let binary = '';
      for (let i = 0; i < data.length; i += 32768)
        binary += String.fromCharCode(...data.subarray(i, i + 32768));
      return { type: 'blob', mime: value.type, bytes: value.size, base64: btoa(binary) };
    }
    if (Array.isArray(value)) return Promise.all(value.map(encode));
    if (value && typeof value === 'object') {
      const result = {};
      for (const [key, item] of Object.entries(value)) result[key] = await encode(item);
      return result;
    }
    return value;
  }
  const archive = await encode({
    format: 'meuagro-pending',
    version: 1,
    user,
    exported_at: new Date(now()).toISOString(),
    operations,
    records,
  });
  if (!user || user !== currentUser())
    throw Error('A conta mudou. Gere a cópia na conta original.');
  return archive;
}
