import type { User, InsertUser, Workout, InsertWorkout, Goal, InsertGoal, Membership, InsertMembership, MembershipKey, InsertMembershipKey, PfIntegration, InsertPfIntegration, ActivityLog, AppleIntegration } from "@shared/schema";
import session from "express-session";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workouts
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  getWorkouts(userId: number): Promise<Workout[]>;
  getWorkoutById(id: number): Promise<Workout | undefined>;
  getRecentWorkouts(userId: number, limit: number): Promise<Workout[]>;
  
  // Goals
  createGoal(goal: InsertGoal): Promise<Goal>;
  getGoals(userId: number): Promise<Goal[]>;
  updateGoalProgress(id: number, progress: number): Promise<Goal | undefined>;
  
  // Memberships
  getMembership(userId: number): Promise<Membership | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembership(id: number, tier: string, endDate: Date): Promise<Membership | undefined>;
  
  // Membership keys (for admin)
  createMembershipKey(key: InsertMembershipKey): Promise<MembershipKey>;
  getMembershipKeys(): Promise<MembershipKey[]>;
  getMembershipKeyByKey(key: string): Promise<MembershipKey | undefined>;
  useMembershipKey(key: string, userId: number): Promise<MembershipKey | undefined>;
  revokeMembershipKey(id: number): Promise<boolean>;
  
  // Planet Fitness integration
  getPfIntegration(userId: number): Promise<PfIntegration | undefined>;
  createPfIntegration(integration: InsertPfIntegration): Promise<PfIntegration>;
  updatePfIntegration(id: number, data: Partial<PfIntegration>): Promise<PfIntegration | undefined>;
  
  // Apple Fitness integration
  getAppleIntegration(userId: number): Promise<AppleIntegration | undefined>;
  updateAppleIntegration(userId: number, isConnected: boolean, data?: any): Promise<AppleIntegration | undefined>;
  
  // Activity logs
  createActivityLog(userId: number, activityType: string, description: string): Promise<ActivityLog>;
  getActivityLogs(userId: number, limit?: number): Promise<ActivityLog[]>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workouts: Map<number, Workout>;
  private goals: Map<number, Goal>;
  private memberships: Map<number, Membership>;
  private membershipKeys: Map<number, MembershipKey>;
  private pfIntegrations: Map<number, PfIntegration>;
  private appleIntegrations: Map<number, AppleIntegration>;
  private activityLogs: Map<number, ActivityLog>;
  
  public sessionStore: session.MemoryStore;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.workouts = new Map();
    this.goals = new Map();
    this.memberships = new Map();
    this.membershipKeys = new Map();
    this.pfIntegrations = new Map();
    this.appleIntegrations = new Map();
    this.activityLogs = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    this.currentId = {
      users: 1,
      workouts: 1,
      goals: 1,
      memberships: 1,
      membershipKeys: 1,
      pfIntegrations: 1,
      appleIntegrations: 1,
      activityLogs: 1,
    };
  }

  // User CRUD operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      role: 'user', 
      createdAt: now 
    };
    
    this.users.set(id, user);
    return user;
  }

  // Workouts CRUD
  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const id = this.currentId.workouts++;
    const now = new Date();
    
    // Calculate estimated calories burned (simplified)
    let caloriesBurned = 0;
    const intensityMultiplier = workout.intensity === 'high' ? 10 : (workout.intensity === 'medium' ? 7 : 5);
    caloriesBurned = workout.duration * intensityMultiplier;
    
    const newWorkout: Workout = {
      ...workout,
      id,
      date: now,
      caloriesBurned,
    };
    
    this.workouts.set(id, newWorkout);
    
    // Create activity log
    await this.createActivityLog(
      workout.userId,
      'workout',
      `Completed a ${workout.duration}-minute ${workout.intensity} intensity ${workout.workoutType} workout`
    );
    
    return newWorkout;
  }

  async getWorkouts(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values())
      .filter(workout => workout.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getWorkoutById(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async getRecentWorkouts(userId: number, limit: number): Promise<Workout[]> {
    return Array.from(this.workouts.values())
      .filter(workout => workout.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  // Goals CRUD
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.currentId.goals++;
    const now = new Date();
    
    const newGoal: Goal = {
      ...goal,
      id,
      progress: 0,
      isCompleted: false,
      startDate: now,
    };
    
    this.goals.set(id, newGoal);
    
    // Create activity log
    await this.createActivityLog(
      goal.userId,
      'goal',
      `Created a new goal: ${goal.title}`
    );
    
    return newGoal;
  }

  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(goal => goal.userId === userId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  async updateGoalProgress(id: number, progress: number): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    
    if (!goal) return undefined;
    
    const isCompleted = progress >= goal.target;
    
    const updatedGoal: Goal = {
      ...goal,
      progress,
      isCompleted,
    };
    
    this.goals.set(id, updatedGoal);
    
    if (isCompleted) {
      await this.createActivityLog(
        goal.userId,
        'goal',
        `Completed goal: ${goal.title}`
      );
    }
    
    return updatedGoal;
  }

  // Memberships CRUD
  async getMembership(userId: number): Promise<Membership | undefined> {
    return Array.from(this.memberships.values())
      .find(membership => membership.userId === userId && membership.isActive);
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const id = this.currentId.memberships++;
    const now = new Date();
    
    // Check if user already has an active membership
    const existingMembership = await this.getMembership(membership.userId);
    
    if (existingMembership) {
      // Deactivate the existing membership
      const updatedMembership: Membership = {
        ...existingMembership,
        isActive: false,
      };
      this.memberships.set(existingMembership.id, updatedMembership);
    }
    
    const newMembership: Membership = {
      ...membership,
      id,
      startDate: now,
      isActive: true,
      membershipKey: null,
    };
    
    this.memberships.set(id, newMembership);
    
    // Create activity log
    await this.createActivityLog(
      membership.userId,
      'membership',
      `Upgraded to ${membership.tier} membership`
    );
    
    return newMembership;
  }

  async updateMembership(id: number, tier: string, endDate: Date): Promise<Membership | undefined> {
    const membership = this.memberships.get(id);
    
    if (!membership) return undefined;
    
    const updatedMembership: Membership = {
      ...membership,
      tier,
      endDate,
    };
    
    this.memberships.set(id, updatedMembership);
    
    // Create activity log
    await this.createActivityLog(
      membership.userId,
      'membership',
      `Updated membership to ${tier}`
    );
    
    return updatedMembership;
  }

  // Membership keys CRUD (for admin)
  async createMembershipKey(key: InsertMembershipKey): Promise<MembershipKey> {
    const id = this.currentId.membershipKeys++;
    const now = new Date();
    
    const newKey: MembershipKey = {
      ...key,
      id,
      createdAt: now,
      usedAt: null,
      usedBy: null,
      isRevoked: false,
    };
    
    this.membershipKeys.set(id, newKey);
    return newKey;
  }

  async getMembershipKeys(): Promise<MembershipKey[]> {
    return Array.from(this.membershipKeys.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getMembershipKeyByKey(key: string): Promise<MembershipKey | undefined> {
    return Array.from(this.membershipKeys.values())
      .find(membershipKey => membershipKey.key === key && !membershipKey.isRevoked && !membershipKey.usedBy);
  }

  async useMembershipKey(key: string, userId: number): Promise<MembershipKey | undefined> {
    const membershipKey = await this.getMembershipKeyByKey(key);
    
    if (!membershipKey) return undefined;
    
    const now = new Date();
    
    const updatedKey: MembershipKey = {
      ...membershipKey,
      usedAt: now,
      usedBy: userId,
    };
    
    this.membershipKeys.set(membershipKey.id, updatedKey);
    
    // Calculate endDate based on duration
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + membershipKey.duration);
    
    // Create new membership
    await this.createMembership({
      userId,
      tier: membershipKey.tier,
      endDate,
    });
    
    return updatedKey;
  }

  async revokeMembershipKey(id: number): Promise<boolean> {
    const membershipKey = this.membershipKeys.get(id);
    
    if (!membershipKey) return false;
    
    const updatedKey: MembershipKey = {
      ...membershipKey,
      isRevoked: true,
    };
    
    this.membershipKeys.set(id, updatedKey);
    return true;
  }

  // Planet Fitness integration
  async getPfIntegration(userId: number): Promise<PfIntegration | undefined> {
    return Array.from(this.pfIntegrations.values())
      .find(integration => integration.userId === userId);
  }

  async createPfIntegration(integration: InsertPfIntegration): Promise<PfIntegration> {
    const id = this.currentId.pfIntegrations++;
    
    const newIntegration: PfIntegration = {
      ...integration,
      id,
      blackCardMember: false,
      lastCheckIn: null,
    };
    
    this.pfIntegrations.set(id, newIntegration);
    
    // Create activity log
    await this.createActivityLog(
      integration.userId,
      'integration',
      'Connected Planet Fitness account'
    );
    
    return newIntegration;
  }

  async updatePfIntegration(id: number, data: Partial<PfIntegration>): Promise<PfIntegration | undefined> {
    const integration = this.pfIntegrations.get(id);
    
    if (!integration) return undefined;
    
    const updatedIntegration: PfIntegration = {
      ...integration,
      ...data,
    };
    
    this.pfIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }

  // Apple Fitness integration
  async getAppleIntegration(userId: number): Promise<AppleIntegration | undefined> {
    return Array.from(this.appleIntegrations.values())
      .find(integration => integration.userId === userId);
  }

  async updateAppleIntegration(userId: number, isConnected: boolean, data?: any): Promise<AppleIntegration | undefined> {
    const integration = Array.from(this.appleIntegrations.values())
      .find(ai => ai.userId === userId);
    
    const now = new Date();
    
    if (integration) {
      const updatedIntegration: AppleIntegration = {
        ...integration,
        isConnected,
        lastSynced: now,
        syncData: data || integration.syncData,
      };
      
      this.appleIntegrations.set(integration.id, updatedIntegration);
      return updatedIntegration;
    } else {
      const id = this.currentId.appleIntegrations++;
      
      const newIntegration: AppleIntegration = {
        id,
        userId,
        isConnected,
        lastSynced: now,
        syncData: data || null,
      };
      
      this.appleIntegrations.set(id, newIntegration);
      
      // Create activity log
      if (isConnected) {
        await this.createActivityLog(
          userId,
          'integration',
          'Connected Apple Fitness account'
        );
      }
      
      return newIntegration;
    }
  }

  // Activity logs
  async createActivityLog(userId: number, activityType: string, description: string): Promise<ActivityLog> {
    const id = this.currentId.activityLogs++;
    const now = new Date();
    
    const newLog: ActivityLog = {
      id,
      userId,
      activityType,
      description,
      timestamp: now,
    };
    
    this.activityLogs.set(id, newLog);
    return newLog;
  }

  async getActivityLogs(userId: number, limit?: number): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return limit ? logs.slice(0, limit) : logs;
  }
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from "./database-storage";

// Use the database implementation
export const storage = new DatabaseStorage();
