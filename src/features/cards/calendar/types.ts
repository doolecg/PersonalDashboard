export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  description?: string;
  category?: string;
};

export type CalendarDay = {
  date: Date;
  dateKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};
