import { Component } from '@angular/core';

import { LayoutManagerComponent } from './components/layout-manager/layout-manager.component';
import { WorkflowDesignerComponent } from './components/workflow-designer/workflow-designer.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { EventSchedulerComponent } from './components/event-scheduler/event-scheduler.component';
import { AdvancedFormStepperComponent } from './components/advanced-form-stepper/advanced-form-stepper.component';
import { TreeViewLargeComponent } from './components/tree-view-large/tree-view-large.component';
import { StickyNotesComponent } from './components/sticky-notes/sticky-notes.component';
import { NotificationHubComponent } from './components/notification-hub/notification-hub.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { DashboardWidgetsComponent } from './components/dashboard-widgets/dashboard-widgets.component';
import { DateRangePickerComponent } from './components/date-range-picker/date-range-picker.component';
import { AutoCompleteComplexComponent } from './components/autocomplete-complex/autocomplete-complex.component';
import { AsyncAutocompleteLabComponent } from './components/async-autocomplete-lab/async-autocomplete-lab.component';
import { ChipsInputLabComponent } from './components/chips-input-lab/chips-input-lab.component';
import { FileDropzoneLabComponent } from './components/file-dropzone-lab/file-dropzone-lab.component';
import { ContextMenuOverlaysLabComponent } from './components/context-menu-overlays-lab/context-menu-overlays-lab.component';

@Component({
    selector: 'app-root',
    imports: [
    LayoutManagerComponent,
    DashboardWidgetsComponent,
    WorkflowDesignerComponent,
    CalendarComponent,
    DateRangePickerComponent,
    EventSchedulerComponent,
    AutoCompleteComplexComponent,
    AdvancedFormStepperComponent,
    TreeViewLargeComponent,
    StickyNotesComponent,
    NotificationHubComponent,
    SettingsPanelComponent,
    AsyncAutocompleteLabComponent,
    ChipsInputLabComponent,
    FileDropzoneLabComponent,
    ContextMenuOverlaysLabComponent
],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
  activeSection: string = 'dashboard';

  sections = [
    { id: 'dashboard', label: 'Main Dashboard', icon: '📊' },
    { id: 'workflow', label: 'Workflow Designer', icon: '🔗' },
    { id: 'calendar', label: 'Enterprise Calendar', icon: '📅' },
    { id: 'date-range-picker', label: 'dateRange picker', icon: '🗓️' },
    { id: 'scheduler', label: 'Event Scheduler', icon: '⏱️' },
    { id: 'stepper', label: 'Deployment Profile', icon: '⚡' },
    { id: 'labs', label: 'Component Labs', icon: '🧪' },
    { id: 'notes', label: 'Sticky Board', icon: '📌' },
    { id: 'notifications', label: 'Alert Hub', icon: '🔔' },
    { id: 'settings', label: 'System Settings', icon: '⚙️' },
  ];

  setSection(id: string) {
    this.activeSection = id;
  }
}
