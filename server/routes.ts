import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, MemStorage } from "./storage";
import { setupAuth, createOwnerAccount } from "./auth";
import { randomUUID } from "crypto";
import { InsertMembershipKey, users } from "@shared/schema";
import { notifyMembershipChange } from "./utils/discord";
import { analyzeWorkoutMood, generateMoodInsights } from "./utils/openai";
import { db } from "./db";

// Helper function to determine if a tier is higher than another
function isHigherTier(upgradeTier: string, currentTier: string): boolean {
  const tierRank = {
    free: 0,
    premium: 1,
    pro: 2,
    elite: 3
  };
  
  const upgradeTierRank = tierRank[upgradeTier as keyof typeof tierRank] || 0;
  const currentTierRank = tierRank[currentTier as keyof typeof tierRank] || 0;
  
  return upgradeTierRank > currentTierRank;
}

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
      
      // Create the workout
      let workoutData = {
        ...req.body,
        userId: req.user.id,
      };
      
      // If mood was provided, generate AI insight for this workout
      if (workoutData.mood) {
        try {
          // Only premium+ users get AI insights (free users still get mood tracking)
          if (membership && ['premium', 'pro', 'elite'].includes(membership.tier)) {
            const insight = await analyzeWorkoutMood(workoutData);
            workoutData.aiInsights = insight;
          }
        } catch (insightError) {
          console.error('Error generating workout mood insights:', insightError);
          // Continue even if insight generation fails
        }
      }
      
      const workout = await storage.createWorkout(workoutData);
      
      res.status(201).json(workout);
    } catch (err) {
      res.status(500).json({ message: "Failed to create workout" });
    }
  });
  
  // AI Mood Insights API
  app.get("/api/workouts/mood-insights", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Check membership tier for AI insights access
      const membership = await storage.getMembership(req.user.id);
      
      // Only premium+ users get AI insights
      if (!membership || !['premium', 'pro', 'elite'].includes(membership.tier)) {
        return res.status(403).json({ 
          message: "Feature unavailable", 
          details: "AI workout mood insights require at least a Premium membership."
        });
      }
      
      // Get user's workouts with mood data
      const workouts = await storage.getWorkouts(req.user.id);
      const workoutsWithMood = workouts.filter(workout => workout.mood);
      
      if (workoutsWithMood.length < 2) {
        return res.json({ 
          insights: "Add mood to more workouts to get personalized AI insights about your workout patterns.",
          workoutsWithMood: workoutsWithMood.length
        });
      }
      
      // Generate insights
      const insights = await generateMoodInsights(workoutsWithMood);
      
      res.json({ 
        insights,
        workoutsWithMood: workoutsWithMood.length 
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to generate mood insights" });
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
      const { tier, membershipKey, forceApply } = req.body;
      
      // Now we require a valid membership key for upgrades
      if (!membershipKey) {
        return res.status(400).json({ 
          message: "A valid membership key is required for upgrading your plan. Please contact sales for a key or use the 'Redeem Key' option instead."
        });
      }
      
      // Check if the provided key is valid
      const keyRecord = await storage.getMembershipKeyByKey(membershipKey);
      
      if (!keyRecord) {
        return res.status(400).json({ message: "Invalid membership key" });
      }
      
      if (keyRecord.isRevoked) {
        return res.status(400).json({ 
          message: "This membership key has been revoked",
          keyData: keyRecord,
          canBypass: false
        });
      }
      
      // Allow force applying with already used keys
      if (keyRecord.usedBy && keyRecord.usedBy !== req.user.id && !forceApply) {
        return res.status(400).json({ 
          message: "This membership key has already been used",
          keyData: keyRecord,
          canBypass: true
        });
      }
      
      if (keyRecord.tier !== tier) {
        return res.status(400).json({ 
          message: `This key is for a ${keyRecord.tier} membership, not ${tier}`,
          keyData: keyRecord,
          canBypass: false
        });
      }
      
      // Use the duration from the membership key
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + keyRecord.duration);
      
      // Set key as used (unless we're forcing and it's already been used by someone else)
      if (!keyRecord.usedBy || keyRecord.usedBy !== req.user.id) {
        await storage.useMembershipKey(membershipKey, req.user.id);
      }
      
      // Create or update membership
      const existingMembership = await storage.getMembership(req.user.id);
      let membership;
      
      if (existingMembership) {
        membership = await storage.updateMembership(existingMembership.id, tier, endDate);
      } else {
        membership = await storage.createMembership({
          userId: req.user.id,
          tier,
          endDate,
          membershipKey: membershipKey,
        });
      }
      
      // Send Discord notification about membership upgrade
      await notifyMembershipChange(
        req.user.username || `User #${req.user.id}`,
        forceApply ? 'key_force_applied' : 'upgraded',
        tier,
        `Upgraded using key: ${membershipKey.substring(0, 4)}...${membershipKey.substring(membershipKey.length - 4)}${forceApply ? ' (Forced)' : ''}. Valid until ${endDate.toLocaleDateString()}`
      );
      
      res.status(201).json(membership);
    } catch (err) {
      res.status(500).json({ message: "Failed to upgrade membership" });
    }
  });
  
  app.post("/api/membership/redeem", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { key, forceApply } = req.body;
      
      // Check if user already has an active membership
      const existingMembership = await storage.getMembership(req.user.id);
      
      const membershipKey = await storage.getMembershipKeyByKey(key);
      
      if (!membershipKey) {
        return res.status(404).json({ message: "The membership key you entered is invalid." });
      }
      
      if (membershipKey.isRevoked) {
        return res.status(403).json({ 
          message: "This membership key has been revoked and is no longer valid.",
          keyData: membershipKey,
          canBypass: false
        });
      }
      
      // Handle already used keys - we'll allow forcing these with confirmation
      if (membershipKey.usedBy && membershipKey.usedBy !== req.user.id) {
        if (forceApply) {
          // Allow the user to force apply the key if they've confirmed
          console.log(`User ${req.user.id} is force-applying previously used key ${key}`);
        } else {
          return res.status(403).json({ 
            message: "This membership key has already been redeemed by another account.",
            keyData: membershipKey,
            canBypass: true
          });
        }
      }
      
      // If user has an existing membership but hasn't chosen to force apply
      if (existingMembership && existingMembership.isActive && !forceApply) {
        // Calculate days remaining
        const today = new Date();
        const endDate = existingMembership.endDate || new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Format the time remaining
        let timeRemainingText = "";
        if (daysRemaining > 365) {
          const years = Math.floor(daysRemaining / 365);
          // Cap the display at 10 years to be more professional
          timeRemainingText = `${Math.min(years, 10)} ${years === 1 ? 'year' : 'years'}`;
        } else if (daysRemaining > 30) {
          const months = Math.floor(daysRemaining / 30);
          timeRemainingText = `${months} ${months === 1 ? 'month' : 'months'}`;
        } else {
          timeRemainingText = `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
        }
        
        // Return a 200 status with detailed information instead of error code
        return res.status(200).json({ 
          status: "current_subscription",
          currentPlan: existingMembership.tier,
          timeRemaining: timeRemainingText,
          keyAccepted: false,
          canBypass: true,
          keyData: membershipKey,
          message: `You currently have an active ${existingMembership.tier} plan with ${timeRemainingText} remaining.`,
          canUpgrade: membershipKey.tier !== existingMembership.tier && isHigherTier(membershipKey.tier, existingMembership.tier)
        });
      }
      
      // If forceApply is true or we're applying a fresh key, proceed with redemption
      
      // If the key was already used but we're forcing it, we don't mark it as used again
      // but we do create/update the membership
      if (!membershipKey.usedBy || membershipKey.usedBy !== req.user.id) {
        await storage.useMembershipKey(key, req.user.id);
      }
      
      // Calculate new end date
      const today = new Date();
      const newEndDate = new Date(today);
      newEndDate.setDate(today.getDate() + membershipKey.duration);
      
      // Create or update membership
      let membership;
      if (existingMembership) {
        // If forcing application to an existing membership, just update it
        membership = await storage.updateMembership(
          existingMembership.id, 
          membershipKey.tier,
          newEndDate
        );
      } else {
        // Create a new membership
        membership = await storage.createMembership({
          userId: req.user.id,
          tier: membershipKey.tier,
          endDate: newEndDate,
          membershipKey: key
        });
      }
      
      // Send Discord notification about key redemption
      await notifyMembershipChange(
        req.user.username || `User #${req.user.id}`,
        forceApply ? 'key_force_applied' : 'key_redeemed',
        membershipKey.tier,
        `Key: ${key.substring(0, 4)}...${key.substring(key.length - 4)}${forceApply ? ' (Forced)' : ''}`
      );
      
      res.json({ 
        message: forceApply 
          ? "Membership key applied with override" 
          : "Membership key redeemed successfully", 
        tier: membershipKey.tier 
      });
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
    if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.role !== "owner")) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      // Using direct database query for DatabaseStorage
      if (storage instanceof MemStorage) {
        const users = Array.from(storage.users.entries()).map(([id, user]) => user);
        res.json(users);
      } else {
        // For DatabaseStorage, we'll use a different approach
        const users = await db.select().from(users);
        res.json(users);
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/admin/membership-keys", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.role !== "owner")) {
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
    if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.role !== "owner")) {
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
    if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.role !== "owner")) {
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
    if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.role !== "owner")) {
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
