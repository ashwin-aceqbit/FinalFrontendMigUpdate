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
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  dayHourSlots = Array.from({ length: 24 }, (_, i) => i);
  
  selectedView: 'day' | 'week' | 'month' | 'agenda' = 'day';
  editingEventId: number | null = null;
  activeDate = new Date();
  eventDraft = {
    title: '',
    date: this.toDateInput(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    status: 'confirmed' as 'confirmed' | 'pending' | 'cancelled',
    description: ''
  };
  
  monthGrid: (Date | null)[][] = [];
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  showEventPopup = false;

  constructor(private sharedData: SharedDataService) { }

  ngOnInit(): void {
    this.sharedData.schedulerEvents$.subscribe(sharedEvents => {
      this.events = sharedEvents.map(event => this.fromSharedEvent(event));
      if (!this.events.length) {
        this.generateHeavyEvents();
      }
    });
    this.generateMonthGrid();
  }

  generateHeavyEvents() {
    const startDate = new Date();
    startDate.setHours(9, 0, 0, 0);
    
    for (let i = 0; i < 5; i++) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + Math.floor(Math.random() * 7));
      start.setHours(8 + Math.floor(Math.random() * 9));

      const end = new Date(start);
      end.setHours(start.getHours() + 1 + Math.floor(Math.random() * 2));

      const event = this.sharedData.createDayEvent({
        id: i,
        title: `Project Sync ${i + 1}`,
        details: `Agenda item ${i + 1} focused on live coordination, milestone review, and next-step actions.`,
        date: start,
        source: 'scheduler',
        editable: true,
        status: i % 10 === 0 ? 'cancelled' : (i % 3 === 0 ? 'pending' : 'confirmed'),
        startTime: this.toTime(start),
        endTime: this.toTime(end)
      });

      this.sharedData.saveSchedulerEvent(event);
    }
  }

  getEventsForSlot(date: Date, hour: number): ScheduledEvent[] {
    return this.events.filter(e => {
      const eventDate = this.parseDateKey(e.date);
      const dayMatches = eventDate.toDateString() === date.toDateString();
      const eventHour = Number(e.startTime.split(':')[0]);
      const endHour = Number(e.endTime.split(':')[0]);
      const hourMatches = eventHour <= hour && endHour > hour;
      return dayMatches && hourMatches;
    });
  }

  calculateHeight(event: ScheduledEvent): number {
    const duration = this.timeDiffHours(event.startTime, event.endTime);
    return duration * 60; // 60px per hour
  }

  openNewEvent(dateInput?: Date, hour = 9) {
    const date = dateInput ? new Date(dateInput) : new Date();
    date.setHours(hour, 0, 0, 0);
    this.editingEventId = null;
    this.eventDraft = {
      title: '',
      date: this.toDateInput(date),
      startTime: `${String(hour).padStart(2, '0')}:00`,
      endTime: `${String(hour + 1).padStart(2, '0')}:00`,
      status: 'confirmed',
      description: ''
    };
    this.activeDate = date;
    this.currentMonth = date.getMonth();
    this.currentYear = date.getFullYear();
    this.generateMonthGrid();
    this.showEventPopup = true;
  }

  editEvent(event: ScheduledEvent) {
    this.editingEventId = event.id;
    this.activeDate = this.parseDateKey(event.date);
    this.currentMonth = this.activeDate.getMonth();
    this.currentYear = this.activeDate.getFullYear();
    this.generateMonthGrid();
    this.eventDraft = {
      title: event.title,
      date: this.toDateInput(this.parseDateKey(event.date)),
      startTime: event.startTime,
      endTime: event.endTime,
      status: event.status,
      description: event.description
    };
    this.showEventPopup = true;
  }

  saveEvent() {
    const sharedEvent = this.sharedData.createDayEvent({
      id: this.editingEventId ?? Date.now(),
      title: this.eventDraft.title,
      details: this.eventDraft.description,
      date: this.fromDateInput(this.eventDraft.date),
      source: 'scheduler',
      editable: true,
      startTime: this.eventDraft.startTime,
      endTime: this.eventDraft.endTime
    });

    this.sharedData.saveSchedulerEvent(sharedEvent);
    this.editingEventId = null;
    this.showEventPopup = false;
  }

  deleteEvent(id: number) {
    this.sharedData.deleteSchedulerEvent(id);
  }

  checkConflicts() {
    console.log('Running heavy conflict detection algorithm...');
    for (let i = 0; i < this.events.length; i++) {
      for (let j = i + 1; j < this.events.length; j++) {
        const e1 = this.events[i];
        const e2 = this.events[j];
        const e1Start = new Date(`${e1.date}T${e1.startTime}`);
        const e1End = new Date(`${e1.date}T${e1.endTime}`);
        const e2Start = new Date(`${e2.date}T${e2.startTime}`);
        const e2End = new Date(`${e2.date}T${e2.endTime}`);
        if (e1Start < e2End && e2Start < e1End) {
          // Conflict detected
        }
      }
    }
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
      editable: event.editable
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

  generateMonthGrid() {
    const date = new Date(this.currentYear, this.currentMonth, 1);
    const firstDay = (date.getDay() + 6) % 7;
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

  getWeekDates(): Date[] {
    const today = new Date(this.activeDate);
    const mondayOffset = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    return this.days.map((_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
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
