const DAY_MS = 24 * 60 * 60 * 1000;

function parseLocalDate(value) {
  if (!value) return null;

  if (
    value instanceof Date
  ) {
    if (
      Number.isNaN(
        value.getTime(),
      )
    ) {
      return null;
    }

    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      12,
      0,
      0,
      0,
    );
  }

  const text =
    String(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text,
    )
  ) {
    const [
      year,
      month,
      day,
    ] =
      text
        .split('-')
        .map(Number);

    if (
      !year ||
      !month ||
      !day
    ) {
      return null;
    }

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

  const parsed =
    new Date(text);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return null;
  }

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    12,
    0,
    0,
    0,
  );
}

function todayLocal() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    12,
    0,
    0,
    0,
  );
}

export function differenceInCalendarDays(
  endValue,
  startValue,
) {
  const end =
    endValue instanceof Date
      ? endValue
      : parseLocalDate(endValue);

  const start =
    startValue instanceof Date
      ? startValue
      : parseLocalDate(startValue);

  if (!end || !start) return null;

  return Math.round(
    (end.getTime() - start.getTime()) / DAY_MS,
  );
}

export function getCycleMetrics(cycle) {
  const today = todayLocal();
  const plantingDate =
    parseLocalDate(cycle?.planting_date);
  const forecastDate =
    parseLocalDate(cycle?.current_harvest_forecast);
  const averageDays =
    Number(cycle?.crop?.average_cycle_days);

  let plantingText =
    'Data de plantio não informada';
  let elapsedDays = null;

  if (plantingDate) {
    elapsedDays =
      differenceInCalendarDays(
        today,
        plantingDate,
      );

    if (elapsedDays > 0) {
      plantingText =
        `Plantado há ${elapsedDays} ${
          elapsedDays === 1 ? 'dia' : 'dias'
        }`;
    } else if (elapsedDays === 0) {
      plantingText = 'Plantado hoje';
    } else {
      const future = Math.abs(elapsedDays);
      plantingText =
        `Plantio em ${future} ${
          future === 1 ? 'dia' : 'dias'
        }`;
    }
  }

  let forecastText =
    'Sem previsão de colheita';
  let daysRemaining = null;
  let delayedDays = 0;

  if (forecastDate) {
    daysRemaining =
      differenceInCalendarDays(
        forecastDate,
        today,
      );

    if (daysRemaining > 0) {
      forecastText =
        `Previsão em ${daysRemaining} ${
          daysRemaining === 1 ? 'dia' : 'dias'
        }`;
    } else if (daysRemaining === 0) {
      forecastText = 'Previsão para hoje';
    } else {
      delayedDays =
        Math.abs(daysRemaining);
      forecastText =
        `Previsão atrasada há ${delayedDays} ${
          delayedDays === 1 ? 'dia' : 'dias'
        }`;
    }
  }

  let progressPercent = null;

  if (
    Number.isFinite(averageDays) &&
    averageDays > 0 &&
    elapsedDays !== null
  ) {
    progressPercent =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (
              Math.max(0, elapsedDays) /
              averageDays
            ) * 100,
          ),
        ),
      );
  }

  return {
    elapsedDays,
    daysRemaining,
    delayedDays,
    progressPercent,
    plantingText,
    forecastText,
  };
}
