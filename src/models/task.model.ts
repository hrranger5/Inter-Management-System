export type TaskStatus = 'To Do' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  internId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  feedback: string;
  dueDate: string;
  progress?: number;
}