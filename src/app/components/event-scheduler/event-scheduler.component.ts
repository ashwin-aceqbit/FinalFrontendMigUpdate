import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedDataService, SharedCalendarEvent } from '../../shared-data.service';

interface ScheduledEvent {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  description: string;
  editable: boolean;
  updatedAt?: string;
}

@Component({
    selector: 'app-event-scheduler',
    imports: [CommonModule, FormsModule],
    templateUrl: './event-scheduler.component.html',
    styleUrls: ['./event-scheduler.component.css']
})
export class EventSchedulerComponent implements OnInit {
  events: ScheduledEvent[] = [];
  hours = Array.from({ length: 24 }, (_, i) => i);
  days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  dayHourSlots = Array.from({ length: 24 }, (_, i) => i);
  
  selectedView: 'day' | 'week' | 'month' | 'agenda' = 'day';
  editingEventId: number | null = null;
  activeDate = new Date();
  eventDraft = {
    title: '',
    date: this.toDateInput(new Date()),
    startHour: 9,
    startMinute: 0,
    endHour: 10,
    endMinute: 0,
    status: 'confirmed' as 'confirmed' | 'pending' | 'cancelled',
    description: ''
  };
  minutes = Array.from({ length: 60 }, (_, i) => i);
  
  monthGrid: (Date | null)[][] = [];
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  showEventPopup = false;

  constructor(private sharedData: SharedDataService) { }

  weekDates: Date[] = [];

  ngOnInit(): void {
    this.sharedData.schedulerEvents$.subscribe(sharedEvents => {
      this.events = sharedEvents.map(event => this.fromSharedEvent(event));
    });
    this.generateMonthGrid();
    this.generateWeekDates();
  }

  getEventsForSlot(date: Date, hour: number): ScheduledEvent[] {
    return this.events.filter(e => {
      const eventDate = this.parseDateKey(e.date);
      const dayMatches = eventDate.toDateString() === date.toDateString();
      const eventStartHour = Math.floor(this.toMinutes(e.startTime) / 60);
      return dayMatches && eventStartHour === hour;
    });
  }

  getEventTopOffset(event: ScheduledEvent): number {
    return 14 + this.toMinutes(event.startTime);
  }

  calculateHeight(event: ScheduledEvent): number {
    const start = this.toMinutes(event.startTime);
    let end = this.toMinutes(event.endTime);
    if (end <= start) {
      end += 24 * 60;
    }
    return end - start;
  }

  getDurationString(event: ScheduledEvent): string {
    const diff = this.calculateHeight(event);
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return hrs > 0 ? `${hrs}h ${mins > 0 ? mins + 'm' : ''}`.trim() : `${mins}m`;
  }

  openNewEvent(dateInput?: Date, hour = 9) {
    const date = dateInput ? new Date(dateInput) : new Date();
    date.setHours(hour, 0, 0, 0);
    this.editingEventId = null;
    this.eventDraft = {
      title: '',
      date: this.toDateInput(date),
      startHour: hour,
      startMinute: 0,
      endHour: hour + 1,
      endMinute: 0,
      status: 'confirmed',
      description: ''
    };
    this.setActiveDate(date);
    this.showEventPopup = true;
  }

  parseTime(timeStr: string) {
    const [h, m] = timeStr.split(':').map(Number);
    return { h: h || 0, m: m || 0 };
  }

  editEvent(event: ScheduledEvent) {
    this.editingEventId = event.id;
    this.setActiveDate(this.parseDateKey(event.date));
    const start = this.parseTime(event.startTime);
    const end = this.parseTime(event.endTime);
    this.eventDraft = {
      title: event.title,
      date: this.toDateInput(this.parseDateKey(event.date)),
      startHour: start.h,
      startMinute: start.m,
      endHour: end.h,
      endMinute: end.m,
      status: event.status,
      description: event.description
    };
    this.showEventPopup = true;
  }

  onDateInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (!this.isSingleDateValue(value)) {
      this.eventDraft.date = this.toDateInput(this.activeDate);
      return;
    }
    const selectedDate = this.fromDateInput(value);
    this.setActiveDate(selectedDate);
  }

  saveEvent() {
    if (!this.isSingleDateValue(this.eventDraft.date)) {
      return;
    }
    const startHourNum = Number(this.eventDraft.startHour);
    const startMinuteNum = Number(this.eventDraft.startMinute);
    const endHourNum = Number(this.eventDraft.endHour);
    const endMinuteNum = Number(this.eventDraft.endMinute);

    const startMinutes = startHourNum * 60 + startMinuteNum;
    const endMinutes = endHourNum * 60 + endMinuteNum;
    const selectedDate = this.fromDateInput(this.eventDraft.date);
    if (endMinutes <= startMinutes) {
      alert('invalid choice');
      return;
    }

    const formatTime = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const startTimeStr = formatTime(startHourNum, startMinuteNum);
    const endTimeStr = formatTime(endHourNum, endMinuteNum);

    const sharedEvent = this.sharedData.createDayEvent({
      id: this.editingEventId ?? Date.now(),
      title: this.eventDraft.title,
      details: this.eventDraft.description,
      date: selectedDate,
      source: 'scheduler',
      editable: true,
      startTime: startTimeStr,
      endTime: endTimeStr
    });
    
    if (this.eventDraft.status) {
      sharedEvent.status = this.eventDraft.status;
    }

    this.sharedData.saveSchedulerEvent(sharedEvent);

    this.setActiveDate(selectedDate);
    this.editingEventId = null;
    this.showEventPopup = false;
  }

  deleteEvent(id: number) {
    this.sharedData.deleteSchedulerEvent(id);
  }

  openAgendaTime(event: ScheduledEvent) {
    this.editEvent(event);
  }

  selectWeekDay(day: Date) {
    this.setActiveDate(day);
  }

  isSameDay(first: Date, second: Date): boolean {
    return first.toDateString() === second.toDateString();
  }

  private setActiveDate(date: Date) {
    this.activeDate = new Date(date);
    this.currentMonth = this.activeDate.getMonth();
    this.currentYear = this.activeDate.getFullYear();
    this.generateMonthGrid();
    this.generateWeekDates();
  }

  private fromSharedEvent(event: SharedCalendarEvent): ScheduledEvent {
    const start = event.startTime ?? '09:00';
    const end = event.endTime ?? '10:00';
    return {
      id: event.id,
      title: event.title,
      date: event.date,
      startTime: start,
      endTime: end,
      status: event.status ?? 'confirmed',
      description: event.details,
      editable: event.editable,
      updatedAt: event.updatedAt
    };
  }

  private toTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private toDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private fromDateInput(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return new Date(value);
    }
    return new Date(year, month - 1, day);
  }

  private parseDateKey(value: string): Date {
    const [datePart] = value.split('T');
    return this.fromDateInput(datePart);
  }

  private timeDiffHours(startTime: string, endTime: string): number {
    const startHour = Number(startTime.split(':')[0]);
    const endHour = Number(endTime.split(':')[0]);
    return Math.max(1, endHour - startHour);
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  }

  private isSingleDateValue(value: string): boolean {
    return Boolean(value) && !value.includes(',') && !value.includes(' to ') && !value.includes(' - ');
  }

  generateMonthGrid() {
    const date = new Date(this.currentYear, this.currentMonth, 1);
    const firstDay = date.getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    this.monthGrid = [];
    let week: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      week.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      if (week.length === 7) {
        this.monthGrid.push(week);
        week = [];
      }
      week.push(new Date(this.currentYear, this.currentMonth, day));
    }
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      this.monthGrid.push(week);
    }
  }

  getEventsForDay(date: Date): ScheduledEvent[] {
    if (!date) return [];
    return this.events.filter(e => this.parseDateKey(e.date).toDateString() === date.toDateString());
  }

  generateWeekDates() {
    const today = new Date(this.activeDate);
    const sundayOffset = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - sundayOffset);
    sunday.setHours(0, 0, 0, 0);

    this.weekDates = this.days.map((_, index) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + index);
      return date;
    });
  }

  prevDay() {
    this.activeDate = new Date(this.activeDate);
    this.activeDate.setDate(this.activeDate.getDate() - 1);
    this.currentMonth = this.activeDate.getMonth();
    this.currentYear = this.activeDate.getFullYear();
    this.generateMonthGrid();
  }

  nextDay() {
    this.activeDate = new Date(this.activeDate);
    this.activeDate.setDate(this.activeDate.getDate() + 1);
    this.currentMonth = this.activeDate.getMonth();
    this.currentYear = this.activeDate.getFullYear();
    this.generateMonthGrid();
  }

  prevMonth() {
    this.currentMonth -= 1;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear -= 1;
    }
    this.generateMonthGrid();
  }

  nextMonth() {
    this.currentMonth += 1;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear += 1;
    }
    this.generateMonthGrid();
  }
}
