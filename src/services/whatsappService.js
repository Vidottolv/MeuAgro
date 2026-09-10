function digitsOnly(value) {
  return String(value || '')
    .replace(/\D/g, '');
}

export function normalizeWhatsAppNumber(value) {
  let digits = digitsOnly(value);

  if (!digits) {
    return '';
  }

  // Números brasileiros informados sem DDI recebem 55.
  if (
    (digits.length === 10 ||
      digits.length === 11) &&
    !digits.startsWith('55')
  ) {
    digits = `55${digits}`;
  }

  return digits;
}

export function isValidWhatsAppNumber(value) {
  const digits =
    normalizeWhatsAppNumber(value);

  return (
    digits.length >= 10 &&
    digits.length <= 15
  );
}

export function buildWhatsAppUrl({
  number,
  message = '',
}) {
  const digits =
    normalizeWhatsAppNumber(number);

  if (
    !isValidWhatsAppNumber(digits)
  ) {
    return null;
  }

  const base =
    `https://wa.me/${digits}`;

  const text =
    String(message || '').trim();

  return text
    ? `${base}?text=${encodeURIComponent(text)}`
    : base;
}

export function buildRestockWhatsAppMessage({
  consultantName,
  productName,
}) {
  return (
    `Olá, ${consultantName}. ` +
    `Estou precisando repor o produto ${productName}. ` +
    `Meu estoque atual está zerado. ` +
    `Poderia me informar preço e disponibilidade?`
  );
}

export function buildGeneralConsultantMessage({
  consultantName,
}) {
  return (
    `Olá, ${consultantName}. ` +
    'Gostaria de conversar sobre uma orientação agrícola.'
  );
}

export function buildConsultantWhatsAppUrl(
  consultant,
  {
    productName = null,
  } = {},
) {
  if (!consultant) {
    return null;
  }

  const message =
    productName
      ? buildRestockWhatsAppMessage({
          consultantName:
            consultant.name,
          productName,
        })
      : buildGeneralConsultantMessage({
          consultantName:
            consultant.name,
        });

  return buildWhatsAppUrl({
    number:
      consultant.whatsapp,
    message,
  });
}
