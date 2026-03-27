import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  tenantName: z.string().min(2).max(200),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  color: z.string().optional(),
  members: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  status: z.enum(['backlog', 'todo', 'in-progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  projectId: z.string(),
  assignees: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  deadline: z.string().optional(),
  order: z.number().optional(),
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['backlog', 'todo', 'in-progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignees: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  deadline: z.string().nullable().optional(),
  order: z.number().optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(2000),
});
