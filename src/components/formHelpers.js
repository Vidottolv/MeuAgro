export function validatePassword(
  password,
) {
  if (password.length < 8) {
    return 'A senha deve possuir pelo menos 8 caracteres.';
  }

  return null;
}
