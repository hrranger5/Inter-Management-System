# Intern Management System

A comprehensive full-stack CRUD application to efficiently manage intern profiles, track their tasks, and monitor performance. It provides a centralized, real-time dashboard for streamlined intern management, complete with data visualizations and a sleek, modern UI.

## ✨ Key Features

*   **Full Intern Lifecycle Management**: Create, read, update, and delete intern profiles.
*   **Detailed Task Tracking**: Assign, edit, and manage tasks for each intern with status, priority, due dates, and progress tracking.
*   **Interactive Performance Dashboard**: At-a-glance KPIs for each intern, including:
    *   Task Completion Rate (visualized with a bar chart).
    *   Average Feedback Score (visualized with a star rating).
    *   Average Task Completion Time.
*   **Historical Performance Trends**: A dynamic, interactive D3.js line chart visualizes an intern's task completion rate over time.
*   **Real-time Filtering**: The application is designed to be extended with search and filtering capabilities.
*   **Visual Alerts**: Overdue tasks are highlighted with a prominent badge and a subtle pulsating animation to draw attention.
*   **Robust User Experience**:
    *   Real-time success and error notifications for all actions.
    *   Confirmation modals for critical operations like deleting items or completing tasks to prevent accidental changes.
*   **Modern & Responsive UI**: A sleek, dark-themed interface built with Tailwind CSS that is intuitive and easy to navigate.

## 🛠️ Tech Stack

This project is a full-stack application composed of a modern Angular frontend and a lightweight Node.js backend.

| Area      | Technology                                                               | Description                                                                 |
| :-------- | :----------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| **Frontend** | **Angular (v20+)**                                                       | A powerful, modern framework for building single-page applications.         |
|           | **TypeScript**                                                           | Provides static typing for robust and maintainable code.                    |
|           | **Tailwind CSS**                                                         | A utility-first CSS framework for rapid UI development.                     |
|           | **D3.js**                                                                | A powerful data visualization library used for the performance trend chart. |
|           | **RxJS**                                                                 | Used for managing asynchronous operations and data streams.                 |
| **Backend**  | **Node.js**                                                              | A JavaScript runtime for building fast and scalable server-side applications. |
|           | **Express.js**                                                           | A minimal and flexible web application framework for Node.js.               |
| **Database** | **JSON File**                                                            | A simple `db.json` file is used for lightweight data persistence.           |

## 📂 Project Structure

The project is organized into two main parts: the frontend `src` directory and the `backend` directory.

```
.
├── backend/
│   ├── db.json               # The flat-file database
│   ├── package.json          # Backend dependencies and scripts
│   ├── server.ts             # The main Express.js server file
│   └── tsconfig.json         # TypeScript configuration for the backend
│
├── src/
│   ├── models/               # TypeScript interfaces for Intern and Task
│   ├── services/             # Angular services for API calls and notifications
│   ├── app.component.html    # The main application template
│   ├── app.component.ts      # The main application logic
│   └── styles.css            # Global styles (e.g., animations)
│
├── index.html                # The main HTML entry point for the app
└── index.tsx                 # The Angular application bootstrap file
```

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You must have [Node.js](https://nodejs.org/) installed on your machine (which includes `npm`).

### Installation & Running

The application consists of a backend server and a frontend client, which must be run simultaneously.

#### 1. Running the Backend Server

The backend server is responsible for serving data to the frontend.

1.  **Open a new terminal** in VS Code (`Terminal` -> `New Terminal`).
2.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
3.  **Install the required dependencies:**
    ```bash
    npm install
    ```
4.  **Start the server:**
    ```bash
    npm start
    ```
    The terminal should display a confirmation message: `Backend server listening at http://localhost:3000`.

**Leave this terminal running.** The backend must be active for the frontend to work.

#### 2. Running the Frontend Application

The easiest way to serve the frontend is using the **Live Server** extension in VS Code.

1.  **Install the Live Server extension** from the VS Code Marketplace (by Ritwick Dey).
2.  In the VS Code file explorer, right-click on the `index.html` file at the root of the project.
3.  Select **"Open with Live Server"**.
4.  Your default web browser will automatically open the application, and it will be fully functional.

## 📋 API Endpoints

The backend provides the following RESTful API endpoints, which the Angular service consumes.

### Interns

| Method | Endpoint             | Description                                   |
| :----- | :------------------- | :-------------------------------------------- |
| `GET`    | `/api/interns`       | Retrieves a list of all interns.              |
| `POST`   | `/api/interns`       | Creates a new intern.                         |
| `PUT`    | `/api/interns/:id`   | Updates an existing intern by their ID.       |
| `DELETE` | `/api/interns/:id`   | Deletes an intern and their associated tasks. |

### Tasks

| Method | Endpoint          | Description                        |
| :----- | :---------------- | :--------------------------------- |
| `GET`    | `/api/tasks`      | Retrieves a list of all tasks.     |
| `POST`   | `/api/tasks`      | Creates a new task.                |
| `PUT`    | `/api/tasks/:id`  | Updates an existing task by its ID. |
| `DELETE` | `/api/tasks/:id`  | Deletes a task by its ID.          |
