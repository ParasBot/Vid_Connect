import { 
  users, User, InsertUser, 
  communities, Community, InsertCommunity,
  communityMembers, CommunityMember, InsertCommunityMember,
  messages, Message, InsertMessage,
  videos, Video, InsertVideo,
  notifications, Notification, InsertNotification
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  searchUsers(query: string): Promise<User[]>;
  
  // Community methods
  getCommunity(id: number): Promise<Community | undefined>;
  getCommunities(): Promise<Community[]>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  getUserCommunities(userId: number): Promise<Community[]>;
  searchCommunities(query: string): Promise<Community[]>;
  
  // Community membership methods
  addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember>;
  removeCommunityMember(userId: number, communityId: number): Promise<boolean>;
  getCommunityMembers(communityId: number): Promise<CommunityMember[]>;
  isCommunityMember(userId: number, communityId: number): Promise<boolean>;
  
  // Message methods
  getMessages(senderId: number, receiverId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<boolean>;
  getRecentChats(userId: number): Promise<{ userId: number, lastMessage: Message }[]>;
  
  // Video methods
  getVideo(id: number): Promise<Video | undefined>;
  getUserVideos(userId: number): Promise<Video[]>;
  getCommunityVideos(communityId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  
  // Notification methods
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private communities: Map<number, Community>;
  private communityMembers: Map<number, CommunityMember>;
  private messages: Map<number, Message>;
  private videos: Map<number, Video>;
  private notifications: Map<number, Notification>;
  private userIdCounter: number;
  private communityIdCounter: number;
  private memberIdCounter: number;
  private messageIdCounter: number;
  private videoIdCounter: number;
  private notificationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.communities = new Map();
    this.communityMembers = new Map();
    this.messages = new Map();
    this.videos = new Map();
    this.notifications = new Map();
    this.userIdCounter = 1;
    this.communityIdCounter = 1;
    this.memberIdCounter = 1;
    this.messageIdCounter = 1;
    this.videoIdCounter = 1;
    this.notificationIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...userData, 
      id, 
      avatarUrl: null, 
      introVideoUrl: null,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];
    
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(
      (user) => 
        user.username.toLowerCase().includes(lowercaseQuery) ||
        user.displayName.toLowerCase().includes(lowercaseQuery) ||
        (user.bio && user.bio.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Community methods
  async getCommunity(id: number): Promise<Community | undefined> {
    return this.communities.get(id);
  }

  async getCommunities(): Promise<Community[]> {
    return Array.from(this.communities.values());
  }

  async createCommunity(communityData: InsertCommunity): Promise<Community> {
    const id = this.communityIdCounter++;
    const now = new Date();
    const community: Community = { 
      ...communityData, 
      id,
      createdAt: now
    };
    this.communities.set(id, community);
    return community;
  }

  async getUserCommunities(userId: number): Promise<Community[]> {
    const memberRecords = Array.from(this.communityMembers.values()).filter(
      (member) => member.userId === userId
    );
    
    return memberRecords.map(
      (record) => this.communities.get(record.communityId)
    ).filter((community): community is Community => !!community);
  }

  async searchCommunities(query: string): Promise<Community[]> {
    if (!query) return [];
    
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.communities.values()).filter(
      (community) => 
        community.name.toLowerCase().includes(lowercaseQuery) ||
        community.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Community membership methods
  async addCommunityMember(memberData: InsertCommunityMember): Promise<CommunityMember> {
    const id = this.memberIdCounter++;
    const now = new Date();
    const member: CommunityMember = { 
      ...memberData, 
      id,
      joinedAt: now
    };
    this.communityMembers.set(id, member);
    return member;
  }

  async removeCommunityMember(userId: number, communityId: number): Promise<boolean> {
    const memberRecord = Array.from(this.communityMembers.values()).find(
      (member) => member.userId === userId && member.communityId === communityId
    );
    
    if (!memberRecord) return false;
    
    this.communityMembers.delete(memberRecord.id);
    return true;
  }

  async getCommunityMembers(communityId: number): Promise<CommunityMember[]> {
    return Array.from(this.communityMembers.values()).filter(
      (member) => member.communityId === communityId
    );
  }

  async isCommunityMember(userId: number, communityId: number): Promise<boolean> {
    return Array.from(this.communityMembers.values()).some(
      (member) => member.userId === userId && member.communityId === communityId
    );
  }

  // Message methods
  async getMessages(senderId: number, receiverId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(
        (msg) => 
          (msg.senderId === senderId && msg.receiverId === receiverId) ||
          (msg.senderId === receiverId && msg.receiverId === senderId)
      )
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const message: Message = { 
      ...messageData, 
      id,
      read: false,
      sentAt: now
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<boolean> {
    const messagesToUpdate = Array.from(this.messages.values())
      .filter(
        (msg) => msg.senderId === senderId && msg.receiverId === receiverId && !msg.read
      );
    
    for (const message of messagesToUpdate) {
      const updatedMessage = { ...message, read: true };
      this.messages.set(message.id, updatedMessage);
    }
    
    return true;
  }

  async getRecentChats(userId: number): Promise<{ userId: number, lastMessage: Message }[]> {
    // Get all messages involving the user
    const userMessages = Array.from(this.messages.values())
      .filter(msg => msg.senderId === userId || msg.receiverId === userId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    
    // Extract unique conversation partners
    const conversations = new Map<number, Message>();
    
    for (const message of userMessages) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, message);
      }
    }
    
    return Array.from(conversations.entries()).map(([partnerId, lastMessage]) => ({
      userId: partnerId,
      lastMessage
    }));
  }

  // Video methods
  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async getUserVideos(userId: number): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCommunityVideos(communityId: number): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.communityId === communityId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createVideo(videoData: InsertVideo): Promise<Video> {
    const id = this.videoIdCounter++;
    const now = new Date();
    const video: Video = { 
      ...videoData, 
      id,
      createdAt: now
    };
    this.videos.set(id, video);
    return video;
  }

  // Notification methods
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const notification: Notification = { 
      ...notificationData, 
      id,
      read: false,
      createdAt: now
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return true;
  }
}

export const storage = new MemStorage();
