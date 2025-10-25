import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Intern } from '../models/intern.model';
import { Task } from '../models/task.model';
import { NotificationService } from './notification.service';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class InternService {
  private httpClient = inject(HttpClient);
  private notificationService = inject(NotificationService);

  private readonly apiUrl = 'http://localhost:3000/api';

  private internsSignal = signal<Intern[]>([]);
  private tasksSignal = signal<Task[]>([]);

  interns = this.internsSignal.asReadonly();

  constructor() {
    this.loadInitialData();
  }
  
  getTasksForIntern(internId: string) {
    return computed(() => this.tasksSignal().filter(task => task.internId === internId));
  }

  private loadInitialData() {
    forkJoin({
      interns: this.httpClient.get<Intern[]>(`${this.apiUrl}/interns`).pipe(
        catchError(err => {
          this.notificationService.show('Failed to load interns.', 'error');
          console.error(err);
          return of([]);
        })
      ),
      tasks: this.httpClient.get<Task[]>(`${this.apiUrl}/tasks`).pipe(
        catchError(err => {
          this.notificationService.show('Failed to load tasks.', 'error');
          console.error(err);
          return of([]);
        })
      )
    }).subscribe(({ interns, tasks }) => {
      this.internsSignal.set(interns);
      this.tasksSignal.set(tasks);
    });
  }

  // Intern CRUD
  addIntern(intern: Omit<Intern, 'id' | 'avatarUrl'>): Observable<Intern> {
    return this.httpClient.post<Intern>(`${this.apiUrl}/interns`, intern).pipe(
      tap({
        next: newIntern => {
          this.internsSignal.update(interns => [...interns, newIntern]);
          this.notificationService.show('Intern added successfully.');
        },
        error: err => {
          this.notificationService.show('Failed to add intern.', 'error');
          console.error(err);
        }
      })
    );
  }

  updateIntern(updatedIntern: Intern): Observable<Intern> {
    return this.httpClient.put<Intern>(`${this.apiUrl}/interns/${updatedIntern.id}`, updatedIntern).pipe(
      tap({
        next: returnedIntern => {
          this.internsSignal.update(interns =>
            interns.map(intern => (intern.id === returnedIntern.id ? returnedIntern : intern))
          );
          this.notificationService.show('Intern profile updated successfully.');
        },
        error: err => {
          this.notificationService.show('Failed to update intern.', 'error');
          console.error(err);
        }
      })
    );
  }

  deleteIntern(internId: string): Observable<unknown> {
    return this.httpClient.delete(`${this.apiUrl}/interns/${internId}`).pipe(
      tap({
        next: () => {
          this.internsSignal.update(interns => interns.filter(intern => intern.id !== internId));
          this.tasksSignal.update(tasks => tasks.filter(task => task.internId !== internId));
          this.notificationService.show('Intern removed.');
        },
        error: err => {
          this.notificationService.show('Failed to remove intern.', 'error');
          console.error(err);
        }
      })
    );
  }
  
  // Task CRUD
  addTask(task: Omit<Task, 'id'>): Observable<Task> {
    return this.httpClient.post<Task>(`${this.apiUrl}/tasks`, task).pipe(
      tap({
          next: newTask => {
              this.tasksSignal.update(tasks => [...tasks, newTask]);
              this.notificationService.show('Task added successfully.');
          },
          error: err => {
              this.notificationService.show('Failed to add task.', 'error');
              console.error(err);
          }
      })
    );
  }

  updateTask(updatedTask: Task): Observable<Task> {
    return this.httpClient.put<Task>(`${this.apiUrl}/tasks/${updatedTask.id}`, updatedTask).pipe(
      tap({
          next: returnedTask => {
              this.tasksSignal.update(tasks =>
                  tasks.map(task => (task.id === returnedTask.id ? returnedTask : task))
                );
              this.notificationService.show('Task updated successfully.');
          },
          error: err => {
              this.notificationService.show('Failed to update task.', 'error');
              console.error(err);
          }
      })
    );
  }

  deleteTask(taskId: string): Observable<unknown> {
    return this.httpClient.delete(`${this.apiUrl}/tasks/${taskId}`).pipe(
      tap({
          next: () => {
              this.tasksSignal.update(tasks => tasks.filter(task => task.id !== taskId));
              this.notificationService.show('Task removed.');
          },
          error: err => {
              this.notificationService.show('Failed to remove task.', 'error');
              console.error(err);
          }
      })
    );
  }
}