// Chat-related type definitions for React Native

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  roomId: string;
  timestamp: string;
  type?: 'text' | 'image' | 'file';
  // Add other message properties as needed
}

export interface CreateIndividualChatroomRequest {
  senderId: string;
  receiverId: string;
  roomName: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatroomInfo {
  roomname: string;
  chatroom: {
    roomName: string;
    type: "individual" | "group";
    createdAt: string;
    updatedAt: string;
    id: string;
  };
  url: string;
  userInfo: {
    id: number;
    profilePic: string;
    name: string;
    bio: string;
    category: string;
    soleUserId: string;
    bucket: string;
    profilePicName: string;
  };
}
