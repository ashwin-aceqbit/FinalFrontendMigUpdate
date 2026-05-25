import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedDataService, SharedCalendarEvent } from '../../shared-data.service';

interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: SharedCalendarEvent[];
  holiday?: string;
  lunarPhase?: string;
  weather?: { temp: number; icon: string };
  metrics?: { cpu: number; memory: number }; // Stress test data
}

@Component({
    selector: 'app-calendar',
    imports: [CommonModule, FormsModule],
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  days: CalendarDay[] = [];
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarEvents: SharedCalendarEvent[] = [];
  selectedDate = new Date();
  editingEventId: number | null = null;
  eventDraft = {
    title: '',
    details: '',
    startTime: '09:00',
    endTime: '10:00',
    priority: 'medium' as 'low' | 'medium' | 'high'
  };
  
  hours = Array.from({ length: 24 }, (_, i) => i);
  lunarPhases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];

  constructor(private sharedData: SharedDataService) { }

  ngOnInit() {
    this.sharedData.calendarEvents$.subscribe(events => {
      this.calendarEvents = events;
      this.generateCalendar();
    });
    this.selectedDate = new Date(this.currentDate);
    this.generateCalendar();
  }

  generateCalendar() {
    this.days = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Padding for previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      this.days.push(this.createEnhancedDay(date, false));
    }
    
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      this.days.push(this.createEnhancedDay(date, true));
    }
    
    // Padding for next month
    const endPadding = 42 - this.days.length;
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      this.days.push(this.createEnhancedDay(date, false));
    }
  }

  createEnhancedDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const today = new Date();
    const d = date.getDate();
    
    return {
      date,
      isToday: date.toDateString() === today.toDateString(),
      isCurrentMonth,
      events: this.getEventsForDate(date),
      holiday: d % 10 === 0 ? `Holiday Type ${d}` : undefined,
      lunarPhase: this.lunarPhases[d % 8],
      weather: { temp: 20 + (d % 15), icon: d % 3 === 0 ? '☀️' : (d % 3 === 1 ? '☁️' : '🌧️') },
      metrics: { cpu: Math.random() * 100, memory: Math.random() * 100 }
    };
  }

  getEventsForDate(date: Date): SharedCalendarEvent[] {
    const key = this.getDateKey(date);
    return this.calendarEvents
      .filter(event => event.date.startsWith(key))
      .sort((left, right) => {
        const priorityDiff = this.getPriorityWeight(right.priority) - this.getPriorityWeight(left.priority);
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        return (left.startTime ?? '').localeCompare(right.startTime ?? '');
      });
  }

  selectDate(date: Date) {
    this.selectedDate = date;
    this.editingEventId = null;
    this.eventDraft = { title: '', details: '', startTime: '09:00', endTime: '10:00', priority: 'medium' };
  }

  startEdit(event: SharedCalendarEvent) {
    this.selectedDate = this.parseLocalDate(event.date);
    this.editingEventId = event.id;
    this.eventDraft = {
      title: event.title,
      details: event.details,
      startTime: event.startTime ?? '09:00',
      endTime: event.endTime ?? '10:00',
      priority: event.priority ?? 'medium'
    };
  }

  saveEvent() {
    if (!this.eventDraft.title.trim()) {
      return;
    }

    const startMinutes = this.getMinutes(this.eventDraft.startTime);
    const endMinutes = this.getMinutes(this.eventDraft.endTime);
    if (endMinutes <= startMinutes) {
      alert('Invalid time');
      return;
    }

    const event = this.sharedData.createDayEvent({
      id: this.editingEventId ?? Date.now(),
      title: this.eventDraft.title,
      details: this.eventDraft.details,
      date: this.selectedDate,
      source: 'manual',
      editable: true,
      startTime: this.eventDraft.startTime,
      endTime: this.eventDraft.endTime,
      priority: this.eventDraft.priority
    });

    this.sharedData.saveCalendarEvent(event);

    this.editingEventId = null;
    this.eventDraft = { title: '', details: '', startTime: '09:00', endTime: '10:00', priority: 'medium' };
  }

  removeEvent(id: number) {
    this.sharedData.deleteCalendarEvent(id);
    if (this.editingEventId === id) {
      this.editingEventId = null;
      this.eventDraft = { title: '', details: '', startTime: '09:00', endTime: '10:00', priority: 'medium' };
    }
  }

  getSelectedDayEvents(): SharedCalendarEvent[] {
    return this.getEventsForDate(this.selectedDate);
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  getMonthName(): string {
    return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  private getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseLocalDate(dateKey: string): Date {
    const [datePart] = dateKey.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) {
      return new Date(dateKey);
    }
    return new Date(year, month - 1, day);
  }

  private getPriorityWeight(priority?: 'low' | 'medium' | 'high'): number {
    if (priority === 'high') return 3;
    if (priority === 'medium') return 2;
    return 1;
  }

  private getMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  }
}
