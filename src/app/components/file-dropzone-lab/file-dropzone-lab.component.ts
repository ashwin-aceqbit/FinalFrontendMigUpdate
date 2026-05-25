import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';


interface DropFile {
  id: number;
  name: string;
  sizeLabel: string;
  progress: number;
  status: 'uploading' | 'done';
}

@Component({
    selector: 'app-file-dropzone-lab',
    imports: [],
    templateUrl: './file-dropzone-lab.component.html',
    styleUrls: ['./file-dropzone-lab.component.css']
})
export class FileDropzoneLabComponent implements OnDestroy {
  files: DropFile[] = [];
  dragActive = false;
  private timers = new Map<number, number>();
  private readonly allowedExtensions = new Set(['pdf', 'doc', 'docx', 'jpeg', 'jpg', 'png', 'gif', 'webp']);
  private readonly allowedMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]);

  constructor(private cdr: ChangeDetectorRef) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragActive = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragActive = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragActive = false;
    this.queueFiles(event.dataTransfer?.files);
  }

  onBrowse(event: Event) {
    const input = event.target as HTMLInputElement;
    this.queueFiles(input.files);
    input.value = '';
  }

  removeFile(id: number) {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }

    this.files = this.files.filter(file => file.id !== id);
  }

  ngOnDestroy(): void {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();
  }

  private queueFiles(fileList: FileList | null | undefined) {
    if (!fileList?.length) {
      return;
    }

    Array.from(fileList).filter(file => this.isAllowedFile(file)).forEach(file => {
      const item: DropFile = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: file.name,
        sizeLabel: this.formatSize(file.size),
        progress: 0,
        status: 'uploading'
      };

      this.files = [item, ...this.files];
      this.startUploadSimulation(item.id);
    });
  }

  private isAllowedFile(file: File): boolean {
    if (file.type.startsWith('image/')) {
      return true;
    }

    if (this.allowedMimeTypes.has(file.type)) {
      return true;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension ? this.allowedExtensions.has(extension) : false;
  }

  private startUploadSimulation(id: number) {
    const timer = window.setInterval(() => {
      this.files = this.files.map(file => {
        if (file.id !== id) {
          return file;
        }

        const nextProgress = Math.min(100, file.progress + 14);
        if (nextProgress === 100) {
          const activeTimer = this.timers.get(id);
          if (activeTimer) {
            clearInterval(activeTimer);
            this.timers.delete(id);
          }
        }

        return {
          ...file,
          progress: nextProgress,
          status: nextProgress === 100 ? 'done' : 'uploading'
        };
      });
      // ensure change detection after timer-driven file progress updates
      this.cdr.markForCheck();
    }, 180);

    this.timers.set(id, timer);
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const units = ['KB', 'MB', 'GB'];
    let size = bytes / 1024;
    let index = 0;

    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index++;
    }

    return `${size.toFixed(1)} ${units[index]}`;
  }
}