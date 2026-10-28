const count = (v) => (Number.isSafeInteger(Number(v)) && Number(v) >= 0 ? Number(v) : 0);
// Lista explícita: nunca exportar objetos da sessão, erros, IDs, notas ou registros de campo.
export function makeSupportDiagnostic(server, device) {
  return {
    schema: 'meuagro-diagnostic-v1',
    generated_at: new Date().toISOString(),
    online: device?.online === true,
    offline: {
      pending: count(device?.pending),
      review: (device?.queue || []).filter((x) => x.state === 'review').length,
      prepared: !!device?.preparedAt,
    },
    server: server
      ? {
          checkout_review: count(server.checkout_review),
          billing_pending: server.billing_pending === true,
          satellite: server.satellite
            ? {
                images_pending: count(server.satellite.images_pending),
                images_failed: count(server.satellite.images_failed),
                searches_pending: count(server.satellite.searches_pending),
                searches_failed: count(server.satellite.searches_failed),
              }
            : null,
        }
      : null,
  };
}
