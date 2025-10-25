import { Component, ChangeDetectionStrategy, signal, effect, computed, WritableSignal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Intern } from './models/intern.model';
import { Task, TaskStatus, TaskPriority } from './models/task.model';
import { InternService } from './services/intern.service';
import { NotificationService } from './services/notification.service';
import { Observable } from 'rxjs';

declare var d3: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  internService = inject(InternService);
  notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  @ViewChild('chartContainer') chartContainer: ElementRef;

  interns = this.internService.interns;
  notifications = this.notificationService.notifications;

  selectedIntern: WritableSignal<Intern | null> = signal(null);
  tasksForSelectedIntern = computed(() => {
    const selected = this.selectedIntern();
    if (!selected) return [];
    return this.internService.getTasksForIntern(selected.id)();
  });
  
  performanceMetrics = computed(() => {
    const tasks = this.tasksForSelectedIntern();
    if (tasks.length === 0) {
      return { completionRate: 0, averageFeedbackScore: 0, avgTimeToComplete: 0 };
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    const tasksWithFeedback = completedTasks.filter(t => t.feedback.trim() !== '');

    const completionRate = (completedTasks.length / totalTasks) * 100;

    // Mock score generation for tasks with feedback
    const mockTotalScore = tasksWithFeedback.reduce((acc, task) => {
      const numericId = parseInt(task.id.replace(/\D/g, ''), 10) || 0;
      const score = 4.0 + ((numericId % 11) / 10); // Score between 4.0 and 5.0
      return acc + score;
    }, 0);
    const averageFeedbackScore = tasksWithFeedback.length > 0 ? mockTotalScore / tasksWithFeedback.length : 0;

    // Mock time-to-complete generation for completed tasks
    const mockTotalDays = completedTasks.reduce((acc, task) => {
      const numericId = parseInt(task.id.replace(/\D/g, ''), 10) || 0;
      const days = 2 + (numericId % 6); // Days between 2 and 7
      return acc + days;
    }, 0);
    const avgTimeToComplete = completedTasks.length > 0 ? mockTotalDays / completedTasks.length : 0;

    return {
      completionRate: Math.round(completionRate),
      averageFeedbackScore: parseFloat(averageFeedbackScore.toFixed(1)),
      avgTimeToComplete: parseFloat(avgTimeToComplete.toFixed(1)),
    };
  });

  feedbackStars = computed(() => {
    const score = this.performanceMetrics().averageFeedbackScore;
    const stars: ('full' | 'half' | 'empty')[] = [];
    for (let i = 0; i < 5; i++) {
      if (score >= i + 1) {
        stars.push('full');
      } else if (score >= i + 0.5) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  });
  
  historicalPerformance = computed(() => {
    const intern = this.selectedIntern();
    if (!intern || this.tasksForSelectedIntern().length === 0) return [];
    
    const idHash = intern.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const trends: { week: string; completionRate: number }[] = [];
    const baseRate = 30 + (idHash % 30);

    for (let i = 0; i < 5; i++) {
        const fluctuation = (idHash % (10 + i * 2)) - (5 + i);
        const rate = Math.min(100, Math.max(0, baseRate + i * 10 + fluctuation));
        trends.push({
            week: `Week ${i + 1}`,
            completionRate: Math.round(rate),
        });
    }
    return trends;
  });

  isInternFormVisible = signal(false);
  isTaskFormVisible = signal(false);
  isConfirmDeleteVisible = signal(false);
  isConfirmCompleteVisible = signal(false);
  
  editingIntern: WritableSignal<Intern | null> = signal(null);
  editingTask: WritableSignal<Task | null> = signal(null);
  pendingTaskUpdate: WritableSignal<Task | null> = signal(null);
  
  internForm: FormGroup;
  taskForm: FormGroup;
  
  itemToDelete: WritableSignal<{id: string, type: 'intern' | 'task'} | null> = signal(null);

  taskStatuses: TaskStatus[] = ['To Do', 'In Progress', 'Completed'];
  taskPriorities: TaskPriority[] = ['Low', 'Medium', 'High'];

  constructor() {
    this.internForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      university: ['', Validators.required],
      startDate: ['', Validators.required],
    });

    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: ['To Do' as TaskStatus, Validators.required],
      priority: ['Medium' as TaskPriority, Validators.required],
      feedback: [''],
      dueDate: ['', Validators.required],
      progress: [0],
    });

    effect(() => {
      const data = this.historicalPerformance();
      if (data.length > 0 && this.chartContainer) {
          this.drawChart(data);
      } else if (this.chartContainer) {
          d3.select(this.chartContainer.nativeElement).select('svg').remove();
      }
    });

    effect(() => {
      // Keep selected intern data fresh. If the intern list updates (e.g., after an edit or delete),
      // find the updated intern object and update the selectedIntern signal to reflect changes.
      const currentSelected = this.selectedIntern();
      if (currentSelected) {
        const updatedInternInList = this.interns().find(i => i.id === currentSelected.id);
        
        if (!updatedInternInList) { // Intern was deleted
            this.selectedIntern.set(null);
        } else if (updatedInternInList !== currentSelected) { // Intern was updated
          this.selectedIntern.set(updatedInternInList);
        }
      }
    });
  }

  selectIntern(intern: Intern | null) {
    this.selectedIntern.set(intern);
  }

  // Intern Form
  openAddInternForm() {
    this.editingIntern.set(null);
    this.internForm.reset({ startDate: this.getTodayDate() });
    this.isInternFormVisible.set(true);
  }

  openEditInternForm(intern: Intern) {
    this.editingIntern.set(intern);
    this.internForm.patchValue(intern);
    this.isInternFormVisible.set(true);
  }

  saveIntern() {
    if (this.internForm.invalid) {
      this.notificationService.show('Please fill all required fields correctly.', 'error');
      return;
    }

    let saveOperation: Observable<Intern>;

    if (this.editingIntern()) {
      const updatedIntern: Intern = { ...this.editingIntern()!, ...this.internForm.value };
      saveOperation = this.internService.updateIntern(updatedIntern);
    } else {
      saveOperation = this.internService.addIntern(this.internForm.value);
    }

    saveOperation.subscribe({
      next: () => this.closeForms(),
      error: () => {
        // The service shows the error notification.
        // The form remains open for the user to retry.
      },
    });
  }

  // Task Form
  openAddTaskForm() {
    this.editingTask.set(null);
    this.taskForm.reset({ status: 'To Do', priority: 'Medium', feedback: '', dueDate: this.getTodayDate(), progress: 0 });
    this.isTaskFormVisible.set(true);
  }

  openEditTaskForm(task: Task) {
    this.editingTask.set(task);
    this.taskForm.patchValue(task);
    this.isTaskFormVisible.set(true);
  }
  
  saveTask() {
    if (this.taskForm.invalid || !this.selectedIntern()) return;

    let saveOperation: Observable<Task>;

    if (this.editingTask()) {
      const updatedTask: Task = { ...this.editingTask()!, ...this.taskForm.value };

      // Intercept if task is being marked as complete to show confirmation
      if (this.editingTask()!.status !== 'Completed' && updatedTask.status === 'Completed') {
        this.pendingTaskUpdate.set(updatedTask);
        this.isConfirmCompleteVisible.set(true);
        return; // Wait for user confirmation
      }

      saveOperation = this.internService.updateTask(updatedTask);
    } else {
      const newTaskData = { ...this.taskForm.value, internId: this.selectedIntern()!.id };
      saveOperation = this.internService.addTask(newTaskData);
    }

    saveOperation.subscribe({
      next: () => this.closeForms(),
      error: () => {
        // The service shows the error notification.
        // The form remains open for the user to retry.
      },
    });
  }

  executeCompleteTask() {
    const taskToComplete = this.pendingTaskUpdate();
    if (!taskToComplete) return;

    this.internService.updateTask(taskToComplete).subscribe({
      next: () => this.closeForms(),
      error: () => {
        // On error, hide the confirmation modal and reset state
        this.isConfirmCompleteVisible.set(false);
        this.pendingTaskUpdate.set(null);
      }
    });
  }

  closeForms() {
    this.isInternFormVisible.set(false);
    this.isTaskFormVisible.set(false);
    this.isConfirmDeleteVisible.set(false);
    this.isConfirmCompleteVisible.set(false);
    this.editingIntern.set(null);
    this.editingTask.set(null);
    this.itemToDelete.set(null);
    this.pendingTaskUpdate.set(null);
  }
  
  // Deletion
  confirmDelete(id: string, type: 'intern' | 'task') {
      this.itemToDelete.set({ id, type });
      this.isConfirmDeleteVisible.set(true);
  }
  
  executeDelete() {
    const item = this.itemToDelete();
    if (!item) return;

    const deleteOperation = item.type === 'intern'
      ? this.internService.deleteIntern(item.id)
            : this.internService.deleteTask(item.id);
    
    deleteOperation.subscribe({
        next: () => this.closeForms(),
        error: () => {
          // On error, hide the confirmation modal and reset state
          this.isConfirmDeleteVisible.set(false);
          this.itemToDelete.set(null);
        },
    });
  }

  getTodayDate(): string {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  getTaskStatusClass(status: TaskStatus): string {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-400';
      case 'In Progress': return 'bg-blue-500/20 text-blue-400';
      case 'To Do': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }

  getTaskPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case 'High': return 'bg-red-500/20 text-red-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'Low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }

  isTaskOverdue(task: Task): boolean {
    if (task.status === 'Completed' || !task.dueDate) {
      return false;
    }
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(23, 59, 59, 999); // Consider the entire day for due date
    return dueDate < new Date();
  }

  dismissNotification(id: number) {
    this.notificationService.dismiss(id);
  }

  private drawChart(data: { week: string; completionRate: number }[]): void {
    const element = this.chartContainer.nativeElement;
    d3.select(element).select('svg').remove();
    d3.select(element).select('.tooltip').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = element.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select(element)
      .append('div')
      .attr('class', 'tooltip absolute bg-slate-900 border border-slate-600 rounded-md px-3 py-1 text-sm text-white pointer-events-none transition-opacity duration-200')
      .style('opacity', 0);

    const x = d3.scalePoint()
      .domain(data.map(d => d.week))
      .range([0, width])
      .padding(0.5);

    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('fill', '#94a3b8');

    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    const yAxis = svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d: any) => `${d}%`));
    
    yAxis.selectAll('text').style('fill', '#94a3b8');
    yAxis.selectAll('.domain, .tick line').style('stroke', '#475569');

    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(() => ''))
      .selectAll('line')
      .style('stroke', '#334155')
      .style('stroke-opacity', '0.7');
    svg.select('.grid .domain').remove();

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#818cf8')
      .attr('stroke-width', 2.5)
      .attr('d', d3.line()
        .x((d: any) => x(d.week))
        .y((d: any) => y(d.completionRate))
        .curve(d3.curveMonotoneX)
      );

    svg.selectAll('myCircles')
      .data(data)
      .enter()
      .append('circle')
      .attr('fill', '#818cf8')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 2)
      .attr('cx', (d: any) => x(d.week))
      .attr('cy', (d: any) => y(d.completionRate))
      .attr('r', 5)
      .on('mouseover', () => tooltip.style('opacity', 1))
      .on('mousemove', (event: any, d: any) => {
        const [posX, posY] = d3.pointer(event, svg.node());
        tooltip
          .html(`<b>${d.week}</b><br>${d.completionRate}% Complete`)
          .style('left', `${posX + 15}px`)
          .style('top', `${posY}px`);
      })
      .on('mouseout', () => tooltip.style('opacity', 0));
  }
}
