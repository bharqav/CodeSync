export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
}

export interface Message {
    id: string;
    content: string;
    userId: string;
    workspaceId: string;
    createdAt: string; // ISO Date string
    user?: User; // Hydrated user
}

export interface Workspace {
    id: string;
    createdAt: string;
}

export interface ServerToClientEvents {
    "chat:message": (message: Message) => void;
    "workspace:state": (messages: Message[]) => void;
    "user:joined": (user: User) => void;
}

export interface ClientToServerEvents {
    "chat:send": (content: string, workspaceId: string) => void;
    "join:workspace": (workspaceId: string) => void;
}
