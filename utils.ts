
import { format, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  });
  return formatter.format(value);
};

export const formatDate = (dateString: string) => {
  return format(parseISO(dateString), 'MMM d, yyyy • HH:mm', { locale: fr });
};

export const isDateInRange = (date: string, range: 'Week' | 'Month' | 'Year' | 'All') => {
  if (range === 'All') return true;
  const now = new Date();
  const target = parseISO(date);
  let start, end;

  if (range === 'Week') {
    start = startOfWeek(now, { weekStartsOn: 1 });
    end = endOfWeek(now, { weekStartsOn: 1 });
  } else if (range === 'Month') {
    start = startOfMonth(now);
    end = endOfMonth(now);
  } else {
    start = startOfYear(now);
    end = endOfYear(now);
  }

  return isWithinInterval(target, { start, end });
};
