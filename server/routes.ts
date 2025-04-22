import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, loginUserSchema, 
  insertCommunitySchema, insertCommunityMemberSchema,
  insertMessageSchema, insertVideoSchema, insertNotificationSchema
} from "@shared/schema";
import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_disk = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const uniquePrefix = crypto.randomBytes(16).toString("hex");
    cb(null, `${uniquePrefix}${fileExt}`);
  },
});

const upload = multer({ 
  storage: storage_disk,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// WebSocket clients map
const clients = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Add a simple health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server with more robust configuration
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws',
    // Adding more robust error handling
    clientTracking: true,
    perMessageDeflate: false // Disable compression for simplicity
  });
  
  // WebSocket connection handler
  wss.on("connection", function connection(ws: WebSocket) {
    let userId: number | null = null;
    
    ws.on("message", async function incoming(message) {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "auth" && data.userId) {
          userId = data.userId;
          clients.set(userId, ws);
          console.log(`User ${userId} connected to WebSocket`);
        } else if (data.type === "message" && userId && data.to && data.content) {
          // Create the message in storage
          const newMessage = await storage.createMessage({
            senderId: userId,
            receiverId: data.to,
            content: data.content
          });
          
          // Send to recipient if online
          const recipientWs = clients.get(data.to);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify({
              type: "message",
              from: userId,
              content: data.content,
              id: newMessage.id,
              sentAt: newMessage.sentAt
            }));
          }
          
          // Send notification
          await storage.createNotification({
            userId: data.to,
            type: "message",
            content: `New message from ${(await storage.getUser(userId))?.displayName}`,
            relatedId: newMessage.id
          });
          
          // Echo back to sender
          ws.send(JSON.stringify({
            type: "message_sent",
            to: data.to,
            content: data.content,
            id: newMessage.id,
            sentAt: newMessage.sentAt
          }));
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });
    
    ws.on("close", function() {
      if (userId) {
        clients.delete(userId);
        console.log(`User ${userId} disconnected from WebSocket`);
      }
    });
  });
  
  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      const existingEmail = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create the user
      const user = await storage.createUser(userData);
      
      // Return the user without the password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error: (error as Error).message });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(loginData.username);
      
      if (!user || user.password !== loginData.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Return the user without the password
      const { password, ...userWithoutPassword } = user;
      
      // Set user info in session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error: (error as Error).message });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Not logged in" });
    }
  });
  
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return the user without the password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // User Routes
  app.get("/api/users", async (req, res) => {
    const query = req.query.q as string || "";
    const users = await storage.searchUsers(query);
    
    // Remove passwords
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
  });
  
  app.get("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return the user without the password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  app.patch("/api/users/:id", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId) || req.session.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const userData = req.body;
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return the user without the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error: (error as Error).message });
    }
  });
  
  // Community Routes
  app.get("/api/communities", async (req, res) => {
    const query = req.query.q as string || "";
    
    const communities = query 
      ? await storage.searchCommunities(query)
      : await storage.getCommunities();
    
    res.json(communities);
  });
  
  app.post("/api/communities", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const communityData = insertCommunitySchema.parse({
        ...req.body,
        creatorId: req.session.userId
      });
      
      // Create the community
      const community = await storage.createCommunity(communityData);
      
      // Add creator as a member
      await storage.addCommunityMember({
        userId: req.session.userId,
        communityId: community.id,
        introVideoUrl: null
      });
      
      res.status(201).json(community);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error: (error as Error).message });
    }
  });
  
  app.get("/api/communities/:id", async (req, res) => {
    const communityId = parseInt(req.params.id);
    
    if (isNaN(communityId)) {
      return res.status(400).json({ message: "Invalid community ID" });
    }
    
    const community = await storage.getCommunity(communityId);
    
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }
    
    res.json(community);
  });
  
  app.get("/api/communities/:id/members", async (req, res) => {
    const communityId = parseInt(req.params.id);
    
    if (isNaN(communityId)) {
      return res.status(400).json({ message: "Invalid community ID" });
    }
    
    const members = await storage.getCommunityMembers(communityId);
    const memberDetails = await Promise.all(
      members.map(async member => {
        const user = await storage.getUser(member.userId);
        if (!user) return null;
        
        const { password, ...userWithoutPassword } = user;
        return {
          ...member,
          user: userWithoutPassword
        };
      })
    );
    
    // Filter out null values (users not found)
    const validMembers = memberDetails.filter(Boolean);
    
    res.json(validMembers);
  });
  
  app.post("/api/communities/:id/join", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const communityId = parseInt(req.params.id);
    
    if (isNaN(communityId)) {
      return res.status(400).json({ message: "Invalid community ID" });
    }
    
    // Check if community exists
    const community = await storage.getCommunity(communityId);
    
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }
    
    // Check if user is already a member
    const isMember = await storage.isCommunityMember(req.session.userId, communityId);
    
    if (isMember) {
      return res.status(400).json({ message: "Already a member of this community" });
    }
    
    try {
      const memberData = insertCommunityMemberSchema.parse({
        userId: req.session.userId,
        communityId,
        introVideoUrl: req.body.introVideoUrl || null
      });
      
      // Add the member
      const member = await storage.addCommunityMember(memberData);
      
      // Create notification for community creator
      await storage.createNotification({
        userId: community.creatorId,
        type: "community_join",
        content: `A new user has joined your community: ${community.name}`,
        relatedId: communityId
      });
      
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error: (error as Error).message });
    }
  });
  
  app.post("/api/communities/:id/leave", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const communityId = parseInt(req.params.id);
    
    if (isNaN(communityId)) {
      return res.status(400).json({ message: "Invalid community ID" });
    }
    
    // Check if user is a member
    const isMember = await storage.isCommunityMember(req.session.userId, communityId);
    
    if (!isMember) {
      return res.status(400).json({ message: "Not a member of this community" });
    }
    
    // Get community to check if user is the creator
    const community = await storage.getCommunity(communityId);
    
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }
    
    if (community.creatorId === req.session.userId) {
      return res.status(400).json({ message: "Creator cannot leave the community" });
    }
    
    // Remove the member
    const success = await storage.removeCommunityMember(req.session.userId, communityId);
    
    if (!success) {
      return res.status(500).json({ message: "Failed to leave community" });
    }
    
    res.json({ message: "Left community successfully" });
  });
  
  app.get("/api/user/communities", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const communities = await storage.getUserCommunities(req.session.userId);
    res.json(communities);
  });
  
  // Message Routes
  app.get("/api/messages/:userId", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const otherUserId = parseInt(req.params.userId);
    
    if (isNaN(otherUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const messages = await storage.getMessages(req.session.userId, otherUserId);
    
    // Mark messages from other user as read
    await storage.markMessagesAsRead(otherUserId, req.session.userId);
    
    res.json(messages);
  });
  
  app.post("/api/messages/:userId", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const receiverId = parseInt(req.params.userId);
    
    if (isNaN(receiverId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      const messageData = insertMessageSchema.parse({
        senderId: req.session.userId,
        receiverId,
        content: req.body.content
      });
      
      // Create the message
      const message = await storage.createMessage(messageData);
      
      // Notify the recipient via WebSocket if they're online
      const recipientWs = clients.get(receiverId);
      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        recipientWs.send(JSON.stringify({
          type: "message",
          from: req.session.userId,
          content: messageData.content,
          id: message.id,
          sentAt: message.sentAt
        }));
      }
      
      // Create a notification
      await storage.createNotification({
        userId: receiverId,
        type: "message",
        content: `New message from ${(await storage.getUser(req.session.userId))?.displayName}`,
        relatedId: message.id
      });
      
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error: (error as Error).message });
    }
  });
  
  app.get("/api/messages", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const recentChats = await storage.getRecentChats(req.session.userId);
    
    // Get user details for each chat
    const chatsWithUserDetails = await Promise.all(
      recentChats.map(async chat => {
        const user = await storage.getUser(chat.userId);
        if (!user) return null;
        
        const { password, ...userWithoutPassword } = user;
        return {
          ...chat,
          user: userWithoutPassword
        };
      })
    );
    
    // Filter out null values (users not found)
    const validChats = chatsWithUserDetails.filter(Boolean);
    
    res.json(validChats);
  });
  
  // Video Routes
  app.post("/api/videos/upload", upload.single("video"), async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: "No video file provided" });
    }
    
    try {
      const videoUrl = `/uploads/${req.file.filename}`;
      const thumbnailUrl = req.body.thumbnailUrl || null;
      
      const videoData = insertVideoSchema.parse({
        userId: req.session.userId,
        title: req.body.title || null,
        description: req.body.description || null,
        url: videoUrl,
        thumbnailUrl,
        communityId: req.body.communityId ? parseInt(req.body.communityId) : null,
        isIntroVideo: req.body.isIntroVideo === "true"
      });
      
      // Create the video record
      const video = await storage.createVideo(videoData);
      
      // If it's an intro video, update the user or community membership
      if (videoData.isIntroVideo) {
        if (videoData.communityId) {
          // Get the membership record
          const members = await storage.getCommunityMembers(videoData.communityId);
          const memberRecord = members.find(m => m.userId === req.session.userId);
          
          if (memberRecord) {
            // Update the member record
            const updatedMember = {
              ...memberRecord,
              introVideoUrl: videoUrl
            };
            
            // We need to remove and re-add since we don't have an update method for members
            await storage.removeCommunityMember(req.session.userId, videoData.communityId);
            await storage.addCommunityMember({
              userId: updatedMember.userId,
              communityId: updatedMember.communityId,
              introVideoUrl: updatedMember.introVideoUrl
            });
          }
        } else {
          // Update user's intro video
          await storage.updateUser(req.session.userId, { introVideoUrl: videoUrl });
        }
      }
      
      res.status(201).json(video);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error: (error as Error).message });
    }
  });
  
  app.get("/api/videos/user/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const videos = await storage.getUserVideos(userId);
    res.json(videos);
  });
  
  app.get("/api/videos/community/:communityId", async (req, res) => {
    const communityId = parseInt(req.params.communityId);
    
    if (isNaN(communityId)) {
      return res.status(400).json({ message: "Invalid community ID" });
    }
    
    const videos = await storage.getCommunityVideos(communityId);
    res.json(videos);
  });
  
  app.get("/api/videos/:id", async (req, res) => {
    const videoId = parseInt(req.params.id);
    
    if (isNaN(videoId)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }
    
    const video = await storage.getVideo(videoId);
    
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    
    res.json(video);
  });
  
  // Notification Routes
  app.get("/api/notifications", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const notifications = await storage.getUserNotifications(req.session.userId);
    res.json(notifications);
  });
  
  app.post("/api/notifications/:id/read", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const notificationId = parseInt(req.params.id);
    
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    
    const success = await storage.markNotificationAsRead(notificationId);
    
    if (!success) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json({ message: "Notification marked as read" });
  });
  
  return httpServer;
}
