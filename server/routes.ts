import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, createOwnerAccount } from "./auth";
import { randomUUID } from "crypto";
import { InsertMembershipKey } from "@shared/schema";
import { notifyMembershipChange } from "./utils/discord";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize authentication
  setupAuth(app);
  
  // Create owner account
  await createOwnerAccount();
  
  // Workouts API
  app.get("/api/workouts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const workouts = await storage.getWorkouts(req.user.id);
      res.json(workouts);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });
  
  app.get("/api/workouts/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const workouts = await storage.getRecentWorkouts(req.user.id, limit);
      res.json(workouts);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch recent workouts" });
    }
  });
  
  app.post("/api/workouts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get user's membership to check workout limitations
      const membership = await storage.getMembership(req.user.id);
      
      if (membership?.tier === "free") {
        // For free tier, check if user has exceeded 5 workouts in the past week
        const weeklyWorkouts = (await storage.getWorkouts(req.user.id))
          .filter(workout => {
            const workoutDate = new Date(workout.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return workoutDate >= weekAgo;
          });
        
        if (weeklyWorkouts.length >= 5) {
          return res.status(403).json({
            message: "Free tier limited to 5 workouts per week. Please upgrade your membership."
          });
        }
      }
      
      const workout = await storage.createWorkout({
        ...req.body,
        userId: req.user.id,
      });
      
      res.status(201).json(workout);
    } catch (err) {
      res.status(500).json({ message: "Failed to create workout" });
    }
  });
  
  // Goals API
  app.get("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const goals = await storage.getGoals(req.user.id);
      res.json(goals);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });
  
  app.post("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get user's membership to check goal limitations
      const membership = await storage.getMembership(req.user.id);
      const currentGoals = await storage.getGoals(req.user.id);
      
      // Enforce goal limits based on tier
      if (membership?.tier === "free" && currentGoals.filter(g => !g.isCompleted).length >= 1) {
        return res.status(403).json({
          message: "Free tier limited to 1 active goal. Please upgrade your membership."
        });
      }
      
      if (membership?.tier === "premium" && currentGoals.filter(g => !g.isCompleted).length >= 5) {
        return res.status(403).json({
          message: "Premium tier limited to 5 active goals. Please upgrade your membership."
        });
      }
      
      const goal = await storage.createGoal({
        ...req.body,
        userId: req.user.id,
      });
      
      res.status(201).json(goal);
    } catch (err) {
      res.status(500).json({ message: "Failed to create goal" });
    }
  });
  
  app.patch("/api/goals/:id/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { progress } = req.body;
      const goalId = parseInt(req.params.id);
      
      const goal = await storage.updateGoalProgress(goalId, progress);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json(goal);
    } catch (err) {
      res.status(500).json({ message: "Failed to update goal progress" });
    }
  });
  
  // Membership API
  app.get("/api/membership", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const membership = await storage.getMembership(req.user.id);
      res.json(membership || { tier: "none" });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch membership" });
    }
  });
  
  app.post("/api/membership/upgrade", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { tier } = req.body;
      
      // This would typically handle payment processing
      // For now, just create the membership
      
      const endDate = new Date();
      // Set end date to 30 days from now
      endDate.setDate(endDate.getDate() + 30);
      
      const membership = await storage.createMembership({
        userId: req.user.id,
        tier,
        endDate,
      });
      
      // Send Discord notification about membership upgrade
      await notifyMembershipChange(
        req.user.username || `User #${req.user.id}`,
        'upgraded',
        tier,
        `Upgraded via payment method. Valid until ${endDate.toLocaleDateString()}`
      );
      
      res.status(201).json(membership);
    } catch (err) {
      res.status(500).json({ message: "Failed to upgrade membership" });
    }
  });
  
  app.post("/api/membership/redeem", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { key } = req.body;
      
      // Check if user already has an active membership
      const existingMembership = await storage.getMembership(req.user.id);
      
      const membershipKey = await storage.getMembershipKeyByKey(key);
      
      if (!membershipKey) {
        return res.status(404).json({ message: "The membership key you entered is invalid or has already been used." });
      }
      
      if (membershipKey.isRevoked) {
        return res.status(403).json({ message: "This membership key has been revoked and is no longer valid." });
      }
      
      if (membershipKey.usedBy) {
        return res.status(403).json({ message: "This membership key has already been redeemed by another account." });
      }
      
      // If user has an existing membership, provide information about it
      if (existingMembership && existingMembership.isActive) {
        // Calculate days remaining
        const today = new Date();
        const endDate = existingMembership.endDate || new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Format the time remaining
        let timeRemainingText = "";
        if (daysRemaining > 365) {
          const years = Math.floor(daysRemaining / 365);
          timeRemainingText = `${years} ${years === 1 ? 'year' : 'years'}`;
        } else if (daysRemaining > 30) {
          const months = Math.floor(daysRemaining / 30);
          timeRemainingText = `${months} ${months === 1 ? 'month' : 'months'}`;
        } else {
          timeRemainingText = `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
        }
        
        return res.status(409).json({ 
          message: `You already have an active ${existingMembership.tier} plan with ${timeRemainingText} remaining.`
        });
      }
      
      // If no existing membership or inactive, proceed with redemption
      const updatedKey = await storage.useMembershipKey(key, req.user.id);
      
      // Send Discord notification about key redemption
      await notifyMembershipChange(
        req.user.username || `User #${req.user.id}`,
        'key_redeemed',
        membershipKey.tier,
        `Key: ${key.substring(0, 4)}...${key.substring(key.length - 4)}`
      );
      
      res.json({ message: "Membership key redeemed successfully", tier: membershipKey.tier });
    } catch (err) {
      res.status(500).json({ message: "We're unable to process your membership key at this time. Please try again later." });
    }
  });
  
  // Planet Fitness Integration API
  app.get("/api/pf-integration", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const integration = await storage.getPfIntegration(req.user.id);
      res.json(integration || { connected: false });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch Planet Fitness integration" });
    }
  });
  
  app.post("/api/pf-integration", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { pfMemberNumber, pfQrCode, pfHomeGym } = req.body;
      
      const integration = await storage.createPfIntegration({
        userId: req.user.id,
        pfMemberNumber,
        pfQrCode,
        pfHomeGym,
      });
      
      res.status(201).json(integration);
    } catch (err) {
      res.status(500).json({ message: "Failed to connect Planet Fitness account" });
    }
  });
  
  app.patch("/api/pf-integration/checkin", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const integration = await storage.getPfIntegration(req.user.id);
      
      if (!integration) {
        return res.status(404).json({ message: "Planet Fitness account not connected" });
      }
      
      const now = new Date();
      const updatedIntegration = await storage.updatePfIntegration(integration.id, {
        lastCheckIn: now,
      });
      
      // Create activity log
      await storage.createActivityLog(
        req.user.id,
        'gym',
        `Checked in at ${integration.pfHomeGym}`
      );
      
      res.json(updatedIntegration);
    } catch (err) {
      res.status(500).json({ message: "Failed to check in" });
    }
  });
  
  // Apple Fitness Integration API
  app.get("/api/apple-integration", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Check membership tier for Apple Fitness access
      const membership = await storage.getMembership(req.user.id);
      const tierMinimum = "premium";
      const tierRank = {
        free: 0,
        premium: 1,
        pro: 2,
        elite: 3
      };
      
      // If user's membership tier is below minimum for Apple Fitness
      if (membership && tierRank[(membership.tier as keyof typeof tierRank)] < tierRank[tierMinimum]) {
        return res.status(403).json({ 
          message: "Feature unavailable", 
          details: `Apple Fitness integration requires at least a ${tierMinimum} membership.` 
        });
      }
      
      const integration = await storage.getAppleIntegration(req.user.id);
      
      // Return existing integration or default data
      res.json(integration || { 
        isConnected: false, 
        data: {
          lastSync: null,
          connectedAt: null,
          deviceInfo: null,
          syncStats: {
            workouts: 0,
            activities: 0,
            steps: 0
          }
        } 
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch Apple Fitness integration" });
    }
  });
  
  app.post("/api/apple-integration", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Check membership tier for Apple Fitness access
      const membership = await storage.getMembership(req.user.id);
      const tierMinimum = "premium";
      const tierRank = {
        free: 0,
        premium: 1,
        pro: 2,
        elite: 3
      };
      
      // If user's membership tier is below minimum for Apple Fitness
      if (membership && tierRank[(membership.tier as keyof typeof tierRank)] < tierRank[tierMinimum]) {
        return res.status(403).json({ 
          message: "Feature unavailable", 
          details: `Apple Fitness integration requires at least a ${tierMinimum} membership.` 
        });
      }
      
      // Set up data for integration
      const now = new Date();
      const data = {
        lastSync: now,
        connectedAt: req.body.data?.connectedAt || now,
        deviceInfo: req.body.data?.deviceInfo || {
          device: "iPhone",
          platform: "iOS",
          osVersion: "15.0 or newer"
        },
        syncStats: req.body.data?.syncStats || {
          workouts: 0,
          activities: 0,
          steps: 0
        }
      };
      
      // Connect to Apple Fitness
      const integration = await storage.updateAppleIntegration(
        req.user.id, 
        true, 
        data
      );
      
      // Create activity log entry
      await storage.createActivityLog(
        req.user.id,
        'integration',
        `Connected Apple Fitness account`
      );
      
      res.status(201).json(integration);
    } catch (err) {
      res.status(500).json({ message: "Failed to connect Apple Fitness account" });
    }
  });
  
  app.post("/api/apple-integration/sync", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Check if Apple Fitness is connected
      const integration = await storage.getAppleIntegration(req.user.id);
      
      if (!integration || !integration.isConnected) {
        return res.status(404).json({ message: "Apple Fitness account not connected" });
      }
      
      // In a real app, this would fetch data from Apple HealthKit
      // For this demo, we'll simulate a sync by updating the last sync time
      const now = new Date();
      
      // Update sync stats with random new data (simulated)
      const syncStats = integration.data?.syncStats || { workouts: 0, activities: 0, steps: 0 };
      const newWorkouts = Math.floor(Math.random() * 3); // 0-2 new workouts
      const newActivities = Math.floor(Math.random() * 5); // 0-4 new activities
      const newSteps = Math.floor(Math.random() * 2000); // 0-1999 new steps
      
      const updatedData = {
        ...integration.data,
        lastSync: now,
        syncStats: {
          workouts: syncStats.workouts + newWorkouts,
          activities: syncStats.activities + newActivities,
          steps: syncStats.steps + newSteps
        }
      };
      
      // Update integration with new sync data
      const updatedIntegration = await storage.updateAppleIntegration(
        req.user.id,
        true,
        updatedData
      );
      
      // Create activity log for sync
      await storage.createActivityLog(
        req.user.id,
        'sync',
        `Synced Apple Fitness data: ${newWorkouts} workouts, ${newActivities} activities, ${newSteps} steps`
      );
      
      res.json({ 
        ...updatedIntegration,
        syncResults: {
          newWorkouts,
          newActivities,
          newSteps,
          timestamp: now
        }
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to sync Apple Fitness data" });
    }
  });
  
  app.delete("/api/apple-integration", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Disconnect Apple Fitness account
      await storage.updateAppleIntegration(
        req.user.id,
        false,
        { disconnectedAt: new Date() }
      );
      
      // Create activity log
      await storage.createActivityLog(
        req.user.id,
        'integration',
        'Disconnected Apple Fitness account'
      );
      
      res.json({ message: "Apple Fitness account disconnected successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to disconnect Apple Fitness account" });
    }
  });
  
  // Admin API endpoints
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const users = Array.from(storage.users.entries()).map(([id, user]) => user);
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/admin/membership-keys", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const keys = await storage.getMembershipKeys();
      res.json(keys);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch membership keys" });
    }
  });
  
  app.post("/api/admin/membership-keys", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const { tier, duration, count = 1 } = req.body;
      const keys = [];
      
      for (let i = 0; i < count; i++) {
        const keyCode = `${tier.substring(0, 3).toUpperCase()}-${randomUUID().substring(0, 8)}`;
        const key: InsertMembershipKey = {
          key: keyCode,
          tier,
          duration: parseInt(duration),
        };
        
        const createdKey = await storage.createMembershipKey(key);
        keys.push(createdKey);
      }
      
      // Send Discord notification for key generation
      if (keys.length > 0) {
        await notifyMembershipChange(
          req.user.username || `Admin #${req.user.id}`,
          'created',
          tier,
          `Generated ${keys.length} membership key(s) with ${duration}-day duration`
        );
      }
      
      res.status(201).json(keys);
    } catch (err) {
      res.status(500).json({ message: "Failed to generate membership keys" });
    }
  });
  
  app.post("/api/admin/membership-keys/:id/revoke", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const keyId = parseInt(req.params.id);
      const success = await storage.revokeMembershipKey(keyId);
      
      if (!success) {
        return res.status(404).json({ message: "Membership key not found" });
      }
      
      res.json({ message: "Membership key revoked successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to revoke membership key" });
    }
  });
  
  app.get("/api/admin/activity-logs", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      // In a real app, we'd fetch from all users
      // For now, just get the admin's logs
      const logs = await storage.getActivityLogs(req.user.id, 100);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
