export const FINANCIAL_RESULT_FILTERS = [
  ['all', 'Todos'],
  ['positive', 'Positivo'],
  ['negative', 'Negativo'],
  ['break_even', 'Empate'],
  ['no_activity', 'Sem movimento'],
];

export function getFinancialResultState(
  summary,
) {
  const inputCost =
    Number(
      summary?.input_cost || 0,
    );

  const revenue =
    Number(
      summary?.sales_revenue || 0,
    );

  const result =
    Number(
      summary?.estimated_result || 0,
    );

  if (
    inputCost === 0 &&
    revenue === 0
  ) {
    return 'no_activity';
  }

  if (result > 0) {
    return 'positive';
  }

  if (result < 0) {
    return 'negative';
  }

  return 'break_even';
}

export function getFinancialResultLabel(
  state,
) {
  switch (state) {
    case 'positive':
      return 'Resultado positivo';

    case 'negative':
      return 'Resultado negativo';

    case 'break_even':
      return 'Empate';

    default:
      return 'Sem movimentação financeira';
  }
}

export function getFinancialResultClass(
  state,
) {
  return `financial-result--${state}`;
}
