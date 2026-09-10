export function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function parseDisplayDate(value) {
  if (!value) {
    return null;
  }

  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    const [
      year,
      month,
      day,
    ] = value
      .split('-')
      .map(Number);

    return new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0,
      0,
    );
  }

  return new Date(value);
}

export function formatDatePtBr(value) {
  if (!value) {
    return '-';
  }

  const date =
    parseDisplayDate(value);

  if (
    !date ||
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(date);
}

export function formatDateTimePtBr(
  value,
) {
  if (!value) {
    return '-';
  }

  const date =
    parseDisplayDate(value);

  if (
    !date ||
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

export function formatNumberPtBr(
  value,
  {
    maximumFractionDigits = 4,
  } = {},
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '-';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '-';
  }

  return new Intl.NumberFormat(
    'pt-BR',
    {
      maximumFractionDigits,
    },
  ).format(number);
}


export function toDateTimeLocalValue(
  value = new Date(),
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '';
  }

  const pad =
    (number) =>
      String(number).padStart(
        2,
        '0',
      );

  return [
    date.getFullYear(),
    '-',
    pad(
      date.getMonth() + 1,
    ),
    '-',
    pad(
      date.getDate(),
    ),
    'T',
    pad(
      date.getHours(),
    ),
    ':',
    pad(
      date.getMinutes(),
    ),
  ].join('');
}


export function dateTimeLocalToIso(
  value,
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date.toISOString();
}


export function formatCurrencyBRL(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '-';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '-';
  }

  return new Intl.NumberFormat(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    },
  ).format(number);
}
