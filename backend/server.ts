// FIX: Use namespaced express types (e.g., express.Request) to avoid conflicts with global DOM types.
// FIX: Import Request and Response types directly from express to ensure correct type resolution.
import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define types locally to avoid complex pathing issues with tsconfig
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

export interface Intern {
  id: string;
  name: string;
  email: string;
  university: string;
  startDate: string;
  avatarUrl: string;
}


const app = express();
const port = 3000;

app.use(cors());
// FIX: Correctly importing express types resolves the overload error for app.use.
app.use(express.json());

// Fix for __dirname not being available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'db.json');

type DbSchema = {
  interns: Intern[];
  tasks: Task[];
};

const readDb = (): DbSchema => {
  const dbRaw = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(dbRaw);
};

const writeDb = (data: DbSchema) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const generateId = (): string => {
    // FIX: The `substr` method is deprecated. Using `substring` is the modern and recommended approach.
    return Math.random().toString(36).substring(2, 11);
};

// --- INTERN ROUTES ---

// GET all interns
// FIX: Correctly type request and response objects to resolve property access errors.
app.get('/api/interns', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.interns);
});

// ADD a new intern
// FIX: Correctly type request and response objects to resolve property access errors.
app.post('/api/interns', (req: Request, res: Response) => {
  const db = readDb();
  const newIntern: Intern = {
    ...req.body,
    id: generateId(),
    avatarUrl: `https://i.pravatar.cc/150?u=${generateId()}`
  };
  db.interns.push(newIntern);
  writeDb(db);
  res.status(201).json(newIntern);
});

// UPDATE an intern
// FIX: Correctly type request and response objects to resolve property access errors.
app.put('/api/interns/:id', (req: Request, res: Response) => {
  const db = readDb();
  const internId = req.params.id;
  const updatedInternData: Intern = req.body;
  
  const index = db.interns.findIndex(intern => intern.id === internId);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Intern not found' });
  }

  db.interns[index] = { ...db.interns[index], ...updatedInternData };
  writeDb(db);
  res.json(db.interns[index]);
});

// DELETE an intern
// FIX: Correctly type request and response objects to resolve property access errors.
app.delete('/api/interns/:id', (req: Request, res: Response) => {
  const db = readDb();
  const internId = req.params.id;
  
  const initialLength = db.interns.length;
  db.interns = db.interns.filter(intern => intern.id !== internId);
  
  if (db.interns.length === initialLength) {
      return res.status(404).json({ message: 'Intern not found' });
  }

  // Also delete tasks associated with the intern
  db.tasks = db.tasks.filter(task => task.internId !== internId);

  writeDb(db);
  res.status(200).json({ message: 'Intern and associated tasks deleted successfully' });
});


// --- TASK ROUTES ---

// GET all tasks
// FIX: Correctly type request and response objects to resolve property access errors.
app.get('/api/tasks', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.tasks);
});

// ADD a new task
// FIX: Correctly type request and response objects to resolve property access errors.
app.post('/api/tasks', (req: Request, res: Response) => {
  const db = readDb();
  const newTask: Task = {
    ...req.body,
    id: generateId()
  };
  db.tasks.push(newTask);
  writeDb(db);
  res.status(201).json(newTask);
});

// UPDATE a task
// FIX: Correctly type request and response objects to resolve property access errors.
app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const db = readDb();
  const taskId = req.params.id;
  const updatedTaskData: Task = req.body;
  
  const index = db.tasks.findIndex(task => task.id === taskId);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  db.tasks[index] = { ...db.tasks[index], ...updatedTaskData };
  writeDb(db);
  res.json(db.tasks[index]);
});

// DELETE a task
// FIX: Correctly type request and response objects to resolve property access errors.
app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const db = readDb();
  const taskId = req.params.id;
  
  const initialLength = db.tasks.length;
  db.tasks = db.tasks.filter(task => task.id !== taskId);

  if (db.tasks.length === initialLength) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  writeDb(db);
  res.status(200).json({ message: 'Task deleted successfully' });
});


app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
