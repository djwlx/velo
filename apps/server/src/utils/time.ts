const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: localTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: localTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function getDateParts(formatter: Intl.DateTimeFormat, date: Date): Record<string, string> {
  return Object.fromEntries(formatter.formatToParts(date).map(({ type, value }) => [type, value]));
}

export function formatLocalDateTime(date = new Date()): string {
  const parts = getDateParts(dateTimeFormatter, date);
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}`;
}

export function formatLocalDate(date = new Date()): string {
  const parts = getDateParts(dateFormatter, date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}
