import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, createOwnerAccount } from "./auth";
import { randomUUID } from "crypto";
import { InsertMembershipKey } from "@shared/schema";

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
      
      res.status(201).json(membership);
    } catch (err) {
      res.status(500).json({ message: "Failed to upgrade membership" });
    }
  });
  
  app.post("/api/membership/redeem", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { key } = req.body;
      
      const membershipKey = await storage.getMembershipKeyByKey(key);
      
      if (!membershipKey) {
        return res.status(404).json({ message: "Invalid or already used membership key" });
      }
      
      const updatedKey = await storage.useMembershipKey(key, req.user.id);
      
      res.json({ message: "Membership key redeemed successfully", tier: membershipKey.tier });
    } catch (err) {
      res.status(500).json({ message: "Failed to redeem membership key" });
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
      const integration = await storage.getAppleIntegration(req.user.id);
      res.json(integration || { isConnected: false });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch Apple Fitness integration" });
    }
  });
  
  app.post("/api/apple-integration", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { isConnected, data } = req.body;
      
      const integration = await storage.updateAppleIntegration(req.user.id, isConnected, data);
      
      res.status(201).json(integration);
    } catch (err) {
      res.status(500).json({ message: "Failed to connect Apple Fitness account" });
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
