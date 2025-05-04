import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model - basic authentication details
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  displayName: text("display_name"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Membership tiers: free, premium, pro, elite
export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tier: text("tier").notNull().default("free"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  membershipKey: text("membership_key"),
});

// Membership keys for admin generation
export const membershipKeys = pgTable("membership_keys", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  tier: text("tier").notNull(),
  duration: integer("duration").notNull(), // in days
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
  usedBy: integer("used_by").references(() => users.id),
  isRevoked: boolean("is_revoked").default(false),
});

// Workouts
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  workoutType: text("workout_type").notNull(), // cardio, strength
  exercise: text("exercise").notNull(),
  duration: integer("duration").notNull(), // in minutes
  intensity: text("intensity").notNull(), // low, medium, high
  notes: text("notes"),
  caloriesBurned: integer("calories_burned"),
  date: timestamp("date").defaultNow(),
  mood: text("mood"), // emoji mood: 😀, 😊, 😐, 😫, 🤩, etc.
  moodReason: text("mood_reason"), // text description of mood
  aiInsights: text("ai_insights"), // AI generated insights about mood patterns
});

// Goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  target: integer("target").notNull(),
  unit: text("unit").notNull(), // km, calories, etc.
  progress: integer("progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
});

// Planet Fitness integration
export const pfIntegration = pgTable("pf_integration", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  pfMemberNumber: text("pf_member_number"),
  pfQrCode: text("pf_qr_code"),
  pfHomeGym: text("pf_home_gym"),
  blackCardMember: boolean("black_card_member").default(false),
  lastCheckIn: timestamp("last_check_in"),
});

// Apple Fitness integration
export const appleIntegration = pgTable("apple_integration", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  isConnected: boolean("is_connected").default(false),
  lastSynced: timestamp("last_synced"),
  syncData: jsonb("sync_data"),
});

// Activity logs for comprehensive tracking
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // workout, goal, membership, etc.
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
});

export const insertMembershipSchema = createInsertSchema(memberships).pick({
  userId: true,
  tier: true,
  endDate: true,
});

export const insertWorkoutSchema = createInsertSchema(workouts).pick({
  userId: true,
  workoutType: true,
  exercise: true,
  duration: true,
  intensity: true,
  notes: true,
  mood: true,
  moodReason: true,
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  userId: true,
  title: true,
  description: true,
  target: true,
  unit: true,
  endDate: true,
});

export const insertMembershipKeySchema = createInsertSchema(membershipKeys).pick({
  key: true,
  tier: true,
  duration: true,
});

export const insertPfIntegrationSchema = createInsertSchema(pfIntegration).pick({
  userId: true,
  pfMemberNumber: true,
  pfQrCode: true,
  pfHomeGym: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof memberships.$inferSelect;

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

export type InsertMembershipKey = z.infer<typeof insertMembershipKeySchema>;
export type MembershipKey = typeof membershipKeys.$inferSelect;

export type InsertPfIntegration = z.infer<typeof insertPfIntegrationSchema>;
export type PfIntegration = typeof pfIntegration.$inferSelect;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type AppleIntegration = typeof appleIntegration.$inferSelect;
