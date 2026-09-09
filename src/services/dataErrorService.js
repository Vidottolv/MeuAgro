export function getDataErrorMessage(
  error,
  fallback =
    'Não foi possível concluir a operação.',
) {
  const code =
    error?.code || '';

  const message =
    error?.message || '';

  const normalized =
    message.toLowerCase();

  if (code === '23505') {
    if (
      normalized.includes(
        'uq_areas_property_name_active',
      )
    ) {
      return 'Já existe uma área ativa com este nome nesta propriedade.';
    }

    if (
      normalized.includes(
        'uq_area_types_user_name',
      )
    ) {
      return 'Você já possui um tipo de área com este nome.';
    }

    if (
      normalized.includes(
        'uq_crops_user_name',
      )
    ) {
      return 'Você já possui uma cultura personalizada com este nome.';
    }

    return 'Já existe um registro com estes dados.';
  }

  if (code === '23503') {
    return 'Este registro está relacionado a outros dados e não pode ser alterado dessa forma.';
  }

  if (
    code === 'P0001' ||
    normalized.includes(
      'propriedade inválida',
    ) ||
    normalized.includes(
      'tipo de área inválido',
    ) ||
    normalized.includes(
      'área inválida',
    ) ||
    normalized.includes(
      'safra inválida',
    ) ||
    normalized.includes(
      'cultura inválida',
    ) ||
    normalized.includes(
      'propriedade inválida',
    )
  ) {
    return message;
  }

  if (
    normalized.includes('jwt') ||
    normalized.includes('session')
  ) {
    return 'Sua sessão não é mais válida. Entre novamente.';
  }

  return message || fallback;
}
