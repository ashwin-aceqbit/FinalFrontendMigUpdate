import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MonthDay {
  date: Date | null;
  label: string;
  inMonth: boolean;
}

interface MonthView {
  title: string;
  days: MonthDay[];
}

@Component({
    selector: 'app-date-range-picker',
    imports: [CommonModule],
    templateUrl: './date-range-picker.component.html',
    styleUrls: ['./date-range-picker.component.css']
})
export class DateRangePickerComponent implements OnInit {
  startDate: Date | null = null;
  endDate: Date | null = null;
  hoverDate: Date | null = null;
  
  presets = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: -1 },
    { label: 'Last 7 Days', days: -7 },
    { label: 'Last 30 Days', days: -30 },
    { label: 'This Month', type: 'currentMonth' },
    { label: 'Last Month', type: 'lastMonth' }
  ];

  calendarMonths: MonthView[] = [];

  constructor() {
    this.initCalendars();
  }

  ngOnInit(): void { }

  initCalendars() {
    const today = new Date();
    this.calendarMonths = [0, 1].map(offset => this.buildMonthView(today.getFullYear(), today.getMonth() + offset));
  }

  selectPreset(preset: any) {
    const today = new Date();
    if (preset.type === 'currentMonth') {
      this.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      this.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else {
      const start = new Date(today);
      start.setDate(today.getDate() + preset.days);
      this.startDate = start;
      this.endDate = today;
    }
  }

  onDateSelect(date: Date) {
    if (!this.startDate || (this.startDate && this.endDate)) {
      this.startDate = date;
      this.endDate = null;
    } else {
      if (date < this.startDate) {
        this.endDate = this.startDate;
        this.startDate = date;
      } else {
        this.endDate = date;
      }
    }
  }

  isInRange(date: Date): boolean {
    if (!this.startDate || !this.endDate) return false;
    return date >= this.startDate && date <= this.endDate;
  }

  isSelectionEdge(date: Date): boolean {
    return (this.startDate?.toDateString() === date.toDateString()) || 
           (this.endDate?.toDateString() === date.toDateString());
  }

  isInHoverRange(date: Date): boolean {
    if (!this.startDate || this.endDate || !this.hoverDate) return false;
    const lower = Math.min(this.startDate.getTime(), this.hoverDate.getTime());
    const upper = Math.max(this.startDate.getTime(), this.hoverDate.getTime());
    const time = date.getTime();
    return time >= lower && time <= upper;
  }

  setHoverDate(date: Date | null) {
    this.hoverDate = date;
  }

  clearRange() {
    this.startDate = null;
    this.endDate = null;
    this.hoverDate = null;
  }

  private buildMonthView(year: number, month: number): MonthView {
    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay();
    const days: MonthDay[] = [];

    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, label: `${date.getDate()}`, inMonth: false });
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, label: `${day}`, inMonth: true });
    }

    while (days.length % 7 !== 0) {
      const nextDate = new Date(year, month, days.length - startDay + 1);
      days.push({ date: nextDate, label: `${nextDate.getDate()}`, inMonth: false });
    }

    return {
      title: firstOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
      days
    };
  }
}
