import { users, workouts, goals, memberships, membershipKeys, activityLogs, pfIntegration, appleIntegration } from "@shared/schema";
import type { User, InsertUser, Workout, InsertWorkout, Goal, InsertGoal, Membership, InsertMembership, MembershipKey, InsertMembershipKey, PfIntegration, InsertPfIntegration, ActivityLog, AppleIntegration } from "@shared/schema";
import { db, pool } from "./db";
import { and, eq, desc, lte, gte } from "drizzle-orm";
import { IStorage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Workouts
  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async getWorkouts(userId: number): Promise<Workout[]> {
    return db.select().from(workouts).where(eq(workouts.userId, userId));
  }

  async getWorkoutById(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }

  async getRecentWorkouts(userId: number, limit: number): Promise<Workout[]> {
    return db.select().from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.date))
      .limit(limit);
  }

  // Goals
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async getGoals(userId: number): Promise<Goal[]> {
    return db.select().from(goals).where(eq(goals.userId, userId));
  }

  async updateGoalProgress(id: number, progress: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    
    if (!goal) return undefined;
    
    const isCompleted = progress >= 100;
    
    const [updatedGoal] = await db
      .update(goals)
      .set({ 
        progress,
        isCompleted
      })
      .where(eq(goals.id, id))
      .returning();
      
    return updatedGoal;
  }

  // Memberships
  async getMembership(userId: number): Promise<Membership | undefined> {
    const [membership] = await db.select().from(memberships).where(eq(memberships.userId, userId));
    return membership;
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const existing = await this.getMembership(membership.userId);
    
    if (existing) {
      const [updatedMembership] = await db
        .update(memberships)
        .set({
          tier: membership.tier,
          endDate: membership.endDate
        })
        .where(eq(memberships.id, existing.id))
        .returning();
        
      return updatedMembership;
    }
    
    const [newMembership] = await db.insert(memberships).values(membership).returning();
    return newMembership;
  }

  async updateMembership(id: number, tier: string, endDate: Date): Promise<Membership | undefined> {
    const [updatedMembership] = await db
      .update(memberships)
      .set({ tier, endDate })
      .where(eq(memberships.id, id))
      .returning();
      
    return updatedMembership;
  }

  // Membership keys
  async createMembershipKey(key: InsertMembershipKey): Promise<MembershipKey> {
    const [newKey] = await db.insert(membershipKeys).values(key).returning();
    return newKey;
  }

  async getMembershipKeys(): Promise<MembershipKey[]> {
    return db.select().from(membershipKeys);
  }

  async getMembershipKeyByKey(key: string): Promise<MembershipKey | undefined> {
    const [membershipKey] = await db
      .select()
      .from(membershipKeys)
      .where(eq(membershipKeys.key, key));
      
    return membershipKey;
  }

  async useMembershipKey(key: string, userId: number): Promise<MembershipKey | undefined> {
    const membershipKey = await this.getMembershipKeyByKey(key);
    
    if (!membershipKey) return undefined;
    
    // Update the key as used
    const [updatedKey] = await db
      .update(membershipKeys)
      .set({
        usedBy: userId,
        usedAt: new Date()
      })
      .where(eq(membershipKeys.id, membershipKey.id))
      .returning();
    
    // Set up the membership for the user
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (membershipKey.duration || 30));
    
    await this.createMembership({
      userId,
      tier: membershipKey.tier,
      endDate
    });
    
    return updatedKey;
  }

  async revokeMembershipKey(id: number): Promise<boolean> {
    const [membershipKey] = await db.select().from(membershipKeys).where(eq(membershipKeys.id, id));
    
    if (!membershipKey) return false;
    
    await db
      .update(membershipKeys)
      .set({
        isRevoked: true,
        revokedAt: new Date()
      })
      .where(eq(membershipKeys.id, id));
    
    return true;
  }

  // Planet Fitness integration
  async getPfIntegration(userId: number): Promise<PfIntegration | undefined> {
    const [integration] = await db.select().from(pfIntegration).where(eq(pfIntegration.userId, userId));
    return integration;
  }

  async createPfIntegration(integration: InsertPfIntegration): Promise<PfIntegration> {
    const existing = await this.getPfIntegration(integration.userId);
    
    if (existing) {
      const [updatedIntegration] = await db
        .update(pfIntegration)
        .set(integration)
        .where(eq(pfIntegration.id, existing.id))
        .returning();
        
      return updatedIntegration;
    }
    
    const [newIntegration] = await db.insert(pfIntegration).values(integration).returning();
    return newIntegration;
  }

  async updatePfIntegration(id: number, data: Partial<PfIntegration>): Promise<PfIntegration | undefined> {
    const [updatedIntegration] = await db
      .update(pfIntegration)
      .set(data)
      .where(eq(pfIntegration.id, id))
      .returning();
      
    return updatedIntegration;
  }

  // Apple Fitness integration
  async getAppleIntegration(userId: number): Promise<AppleIntegration | undefined> {
    const [integration] = await db.select().from(appleIntegration).where(eq(appleIntegration.userId, userId));
    return integration;
  }

  async updateAppleIntegration(userId: number, isConnected: boolean, data?: any): Promise<AppleIntegration | undefined> {
    const existing = await this.getAppleIntegration(userId);
    
    if (existing) {
      const [updatedIntegration] = await db
        .update(appleIntegration)
        .set({
          isConnected,
          data: data || existing.data
        })
        .where(eq(appleIntegration.id, existing.id))
        .returning();
        
      return updatedIntegration;
    }
    
    const [newIntegration] = await db
      .insert(appleIntegration)
      .values({
        userId,
        isConnected,
        data
      })
      .returning();
      
    return newIntegration;
  }

  // Activity logs
  async createActivityLog(userId: number, activityType: string, description: string): Promise<ActivityLog> {
    const [newLog] = await db
      .insert(activityLogs)
      .values({
        userId,
        activityType,
        description,
        timestamp: new Date()
      })
      .returning();
      
    return newLog;
  }

  async getActivityLogs(userId: number, limit?: number): Promise<ActivityLog[]> {
    const query = db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp));
      
    if (limit) {
      query.limit(limit);
    }
    
    return query;
  }
}