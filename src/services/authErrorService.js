export function getAuthErrorMessage(error) {
  const message =
    error?.message?.toLowerCase?.() ?? '';

  if (
    message.includes(
      'invalid login credentials',
    )
  ) {
    return 'E-mail ou senha inválidos.';
  }

  if (
    message.includes('email not confirmed') ||
    message.includes('email_not_confirmed')
  ) {
    return 'Confirme seu e-mail antes de entrar.';
  }

  if (
    message.includes(
      'user already registered',
    ) ||
    message.includes('already registered')
  ) {
    return 'Já existe uma conta cadastrada com este e-mail.';
  }

  if (
    message.includes(
      'password should be at least',
    ) ||
    message.includes('weak password')
  ) {
    return 'A senha não atende aos requisitos mínimos de segurança.';
  }

  if (
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  }

  if (message.includes('network')) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet.';
  }

  return (
    error?.message ||
    'Não foi possível concluir a operação.'
  );
}
