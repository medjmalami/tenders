
export type Project = {
  id: string; // Unique identifier of the project.
  name: string; // Name of the project.
  description: string; // Brief description of the project.
  client: string; // Name of the client the project was developed for.
  startDate: string; // Project start date (ISO 8601 format).
  endDate: string | null; // Project completion date, or null if still ongoing.
  status: "completed" | "in_progress" | "planned"; // Current project status.
  technologies: string[]; // Technologies used during the project.
  teamMembers: string[];        // IDs of employees who worked on the project

};

/**
 * Represents a single employee returned by the Employees API.
 */
export type Employee = {
  id: string; // Unique identifier of the employee.
  firstName: string; // Employee's first name.
  lastName: string; // Employee's last name.
  position: string; // Employee's job title or role.
  department: string; // Department the employee belongs to.
  hireDate: string; // Date the employee joined the company (ISO 8601 format).
  skills: string[]; // List of the employee's professional skills.
  isActive: boolean; // Indicates whether the employee is currently employed.
  yearsOfExperience: number;    // total years of professional experience
  pastProjectIds: string[];     // IDs of projects the employee has worked on
};
