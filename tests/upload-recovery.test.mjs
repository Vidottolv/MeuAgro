import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadPendingFile, duplicateUpload } from '../src/offline/uploadRecovery.js';
test('foto já enviada após resposta perdida aceita 400 conhecido e verifica bytes sem sobrescrever', async () => {
  const file = new Blob(['foto'], { type: 'image/jpeg' });
  let uploads = 0,
    reads = 0;
  await uploadPendingFile(
    {
      upload: async (path, bytes, options) => {
        uploads++;
        assert.equal(options.upsert, false);
        assert.equal(bytes, file);
        return { error: { statusCode: 400, message: 'The resource already exists' } };
      },
      download: async () => {
        reads++;
        return { data: new Blob(['foto']) };
      },
    },
    { storage_path: 'alice/visit/photo.jpg' },
    file,
    () => true,
  );
  assert.equal(uploads, 1);
  assert.equal(reads, 1);
  assert.equal(duplicateUpload({ statusCode: 400, message: 'Invalid request' }), false);
});
test('foto divergente ou sem acesso não é sobrescrita nem considerada enviada', async () => {
  const file = new Blob(['local']);
  await assert.rejects(
    uploadPendingFile(
      {
        upload: async () => ({ error: { statusCode: 409 } }),
        download: async () => ({ data: new Blob(['other']) }),
      },
      { storage_path: 'path' },
      file,
      () => true,
    ),
    (e) => e.code === 'LOCAL_FILE_CONFLICT',
  );
  await assert.rejects(
    uploadPendingFile(
      {
        upload: async () => ({ error: { statusCode: 409 } }),
        download: async () => ({ error: { statusCode: 403, message: 'Acesso revogado' } }),
      },
      { storage_path: 'path' },
      file,
      () => true,
    ),
    (e) => e.statusCode === 403,
  );
  assert.equal(await file.text(), 'local');
});
