import {
  Capacitor,
} from '@capacitor/core';

import {
  Camera,
} from '@capacitor/camera';

function isNative() {
  return Capacitor.isNativePlatform();
}

function normalizeFormat(
  format,
) {
  const value =
    String(format || '')
      .trim()
      .toLowerCase();

  if (
    value === 'jpeg' ||
    value === 'jpg'
  ) {
    return {
      extension: 'jpg',
      mime: 'image/jpeg',
    };
  }

  if (value === 'png') {
    return {
      extension: 'png',
      mime: 'image/png',
    };
  }

  if (value === 'webp') {
    return {
      extension: 'webp',
      mime: 'image/webp',
    };
  }

  return {
    extension: 'jpg',
    mime: 'image/jpeg',
  };
}

async function mediaResultToFile(
  result,
  prefix,
) {
  const previewPath =
    result?.webPath ||
    (
      result?.path
        ? Capacitor.convertFileSrc(
            result.path,
          )
        : null
    );

  if (!previewPath) {
    throw new Error(
      'A imagem retornada pelo dispositivo não possui um caminho de leitura válido.',
    );
  }

  const response =
    await fetch(
      previewPath,
    );

  if (!response.ok) {
    throw new Error(
      'Não foi possível ler a imagem selecionada no dispositivo.',
    );
  }

  const blob =
    await response.blob();

  const format =
    normalizeFormat(
      result.format ||
      blob.type
        ?.split('/')?.[1],
    );

  const mime =
    blob.type?.startsWith(
      'image/',
    )
      ? blob.type
      : format.mime;

  const file =
    new File(
      [blob],
      `${prefix}-${Date.now()}.${format.extension}`,
      {
        type: mime,
        lastModified:
          Date.now(),
      },
    );

  return {
    file,
    previewPath,
    webPath:
      result.webPath ||
      previewPath,
    capturedAt:
      result.exif
        ?.DateTimeOriginal ||
      result.exif
        ?.DateTimeDigitized ||
      null,
  };
}

export function isNativeCameraPlatform() {
  return isNative();
}

export async function takePhotoWithCamera() {
  if (!isNative()) {
    throw new Error(
      'A câmera nativa está disponível no aplicativo Android.',
    );
  }

  const result =
    await Camera.takePhoto({
      quality: 88,
      targetWidth: 1920,
      targetHeight: 1920,
      correctOrientation: true,
      saveToGallery: false,
      editable: 'no',
      includeMetadata: true,
    });

  return mediaResultToFile(
    result,
    'meu-agro-camera',
  );
}

export async function choosePhotoFromGallery() {
  if (!isNative()) {
    throw new Error(
      'Use o seletor de arquivo do navegador para escolher uma imagem.',
    );
  }

  const result =
    await Camera.chooseFromGallery({
      allowMultipleSelection: false,
      quality: 90,
      targetWidth: 1920,
      targetHeight: 1920,
      correctOrientation: true,
      editable: 'no',
      includeMetadata: true,
    });

  const selected =
    result.results?.[0];

  if (!selected) {
    return null;
  }

  return mediaResultToFile(
    selected,
    'meu-agro-galeria',
  );
}
