import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import Membership from '../models/Membership.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';
import Comment from '../models/Comment.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saasify';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔌 Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Tenant.deleteMany({}),
      Membership.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      ActivityLog.deleteMany({}),
      Comment.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing data');

    // Create Users
    const users = await User.create([
      { name: 'Sarah Chen', email: 'sarah@acme.com', password: 'password123', avatar: '', isVerified: true },
      { name: 'James Wilson', email: 'james@acme.com', password: 'password123', avatar: '', isVerified: true },
      { name: 'Emma Rodriguez', email: 'emma@acme.com', password: 'password123', avatar: '', isVerified: true },
      { name: 'Michael Park', email: 'michael@acme.com', password: 'password123', avatar: '', isVerified: true },
    ]);
    console.log('👤 Created users');

    // Create Tenant
    const tenant = await Tenant.create({
      name: 'Acme Corporation',
      slug: 'acme-corporation',
      plan: 'pro',
      owner: users[0]._id,
      memberCount: 4,
      settings: {
        primaryColor: '#6C5CE7',
        features: { kanban: true, analytics: true, devops: true },
      },
    });
    console.log('🏢 Created tenant');

    // Create Memberships
    await Membership.create([
      { userId: users[0]._id, tenantId: tenant._id, role: 'admin', inviteStatus: 'accepted' },
      { userId: users[1]._id, tenantId: tenant._id, role: 'member', inviteStatus: 'accepted' },
      { userId: users[2]._id, tenantId: tenant._id, role: 'member', inviteStatus: 'accepted' },
      { userId: users[3]._id, tenantId: tenant._id, role: 'viewer', inviteStatus: 'accepted' },
    ]);
    console.log('🤝 Created memberships');

    // Create Projects
    const projects = await Project.create([
      {
        tenantId: tenant._id,
        name: 'Website Redesign',
        description: 'Complete overhaul of company website',
        status: 'active',
        color: '#6C5CE7',
        owner: users[0]._id,
        members: [users[0]._id, users[1]._id, users[2]._id, users[3]._id],
        progress: 68,
        taskCount: 24,
      },
      {
        tenantId: tenant._id,
        name: 'Mobile App Launch',
        description: 'iOS and Android app development',
        status: 'active',
        color: '#00B894',
        owner: users[1]._id,
        members: [users[0]._id, users[1]._id, users[2]._id],
        progress: 42,
        taskCount: 31,
      },
      {
        tenantId: tenant._id,
        name: 'API Integration',
        description: 'Third-party service integrations',
        status: 'active',
        color: '#E17055',
        owner: users[0]._id,
        members: [users[0]._id, users[2]._id, users[3]._id],
        progress: 85,
        taskCount: 12,
      },
      {
        tenantId: tenant._id,
        name: 'Security Audit',
        description: 'Comprehensive security review',
        status: 'active',
        color: '#00B894',
        owner: users[2]._id,
        members: [users[0]._id, users[2]._id],
        progress: 23,
        taskCount: 8,
      },
    ]);
    console.log('📂 Created projects');

    // Create Tasks
    const tasks = await Task.create([
      // Backlog
      {
        tenantId: tenant._id, projectId: projects[0]._id,
        title: 'Fix mobile responsiveness', description: 'Ensure all pages work correctly on mobile devices',
        status: 'backlog', priority: 'low', tags: ['frontend', 'mobile'],
        assignees: [users[1]._id], createdBy: users[0]._id, deadline: new Date('2026-03-30'),
      },
      // To Do
      {
        tenantId: tenant._id, projectId: projects[0]._id,
        title: 'Implement authentication system', description: 'Set up OAuth2 with Google and GitHub providers',
        status: 'todo', priority: 'urgent', tags: ['backend', 'security'],
        assignees: [users[0]._id], createdBy: users[0]._id, deadline: new Date('2026-03-20'),
      },
      {
        tenantId: tenant._id, projectId: projects[1]._id,
        title: 'User testing session', description: 'Conduct usability testing with beta users',
        status: 'todo', priority: 'high', tags: ['testing', 'ux'],
        assignees: [users[2]._id, users[3]._id], createdBy: users[1]._id,
      },
      // In Progress
      {
        tenantId: tenant._id, projectId: projects[0]._id,
        title: 'Design new landing page', description: 'Create mockups and prototypes for landing page with modern design',
        status: 'in-progress', priority: 'high', tags: ['design', 'frontend'],
        assignees: [users[1]._id, users[2]._id], createdBy: users[0]._id, deadline: new Date('2026-03-22'), commentCount: 1,
      },
      {
        tenantId: tenant._id, projectId: projects[1]._id,
        title: 'Security penetration test', description: 'Perform comprehensive security testing',
        status: 'in-progress', priority: 'urgent', tags: ['security', 'testing'],
        assignees: [users[2]._id], createdBy: users[0]._id,
      },
      // Review
      {
        tenantId: tenant._id, projectId: projects[2]._id,
        title: 'Write API documentation', description: 'Document all REST endpoint examples',
        status: 'review', priority: 'medium', tags: ['documentation'],
        assignees: [users[0]._id], createdBy: users[1]._id,
      },
      {
        tenantId: tenant._id, projectId: projects[2]._id,
        title: 'Setup CI/CD pipeline', description: 'Configure automated deployment workflow',
        status: 'review', priority: 'high', tags: ['devops', 'automation'],
        assignees: [users[1]._id], createdBy: users[0]._id,
      },
      // Done
      {
        tenantId: tenant._id, projectId: projects[0]._id,
        title: 'Database schema migration', description: 'Migrate from SQL to NoSQL schema',
        status: 'done', priority: 'high', tags: ['backend', 'database'],
        assignees: [users[0]._id], createdBy: users[0]._id, completedAt: new Date('2026-03-15'),
      },
      {
        tenantId: tenant._id, projectId: projects[0]._id,
        title: 'Setup project scaffolding', description: 'Initialize MERN stack with proper folder structure',
        status: 'done', priority: 'medium', tags: ['setup'],
        assignees: [users[0]._id, users[1]._id], createdBy: users[0]._id, completedAt: new Date('2026-03-10'),
      },
      {
        tenantId: tenant._id, projectId: projects[1]._id,
        title: 'UI component library', description: 'Build reusable React component library',
        status: 'done', priority: 'high', tags: ['frontend', 'components'],
        assignees: [users[2]._id], createdBy: users[1]._id, completedAt: new Date('2026-03-12'),
      },
      {
        tenantId: tenant._id, projectId: projects[2]._id,
        title: 'Payment gateway integration', description: 'Integrate Stripe for payment processing',
        status: 'done', priority: 'urgent', tags: ['backend', 'payments'],
        assignees: [users[0]._id], createdBy: users[0]._id, completedAt: new Date('2026-03-14'),
      },
      {
        tenantId: tenant._id, projectId: projects[3]._id,
        title: 'SSL certificate setup', description: 'Configure SSL/TLS for production domains',
        status: 'done', priority: 'urgent', tags: ['devops', 'security'],
        assignees: [users[2]._id], createdBy: users[2]._id, completedAt: new Date('2026-03-11'),
      },
    ]);
    console.log('✅ Created tasks');

    // Create some comments
    await Comment.create([
      {
        tenantId: tenant._id, taskId: tasks[3]._id, userId: users[0]._id,
        content: 'Looking great! Lets finalize the hero section first.',
      },
    ]);
    console.log('💬 Created comments');

    // Create Activity Logs
    await ActivityLog.create([
      { tenantId: tenant._id, userId: users[0]._id, action: 'project.created', entityType: 'project', entityId: projects[0]._id, metadata: { projectName: 'Website Redesign' } },
      { tenantId: tenant._id, userId: users[0]._id, action: 'task.created', entityType: 'task', entityId: tasks[0]._id, metadata: { taskTitle: 'Fix mobile responsiveness' } },
      { tenantId: tenant._id, userId: users[1]._id, action: 'task.status_changed', entityType: 'task', entityId: tasks[3]._id, metadata: { taskTitle: 'Design new landing page', from: 'todo', to: 'in-progress' } },
      { tenantId: tenant._id, userId: users[0]._id, action: 'member.invited', entityType: 'member', entityId: users[3]._id, metadata: { email: 'michael@acme.com', role: 'viewer' } },
    ]);
    console.log('📋 Created activity logs');

    console.log('\n✨ Seed complete!');
    console.log(`\n📧 Login credentials:`);
    console.log(`   Admin:  sarah@acme.com / password123`);
    console.log(`   Member: james@acme.com / password123`);
    console.log(`   Member: emma@acme.com / password123`);
    console.log(`   Viewer: michael@acme.com / password123`);
    console.log(`\n🏢 Tenant: Acme Corporation (ID: ${tenant._id})`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
