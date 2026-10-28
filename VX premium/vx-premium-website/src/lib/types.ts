export type UserStatus = "active" | "disabled";
export type PlaylistType = "xtream" | "m3u";
export type LineStatus = "active" | "disabled";

export type AdminUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  plan: string;
  status: UserStatus;
  expiresAt: string;
  maxConnections: number;
  allowOwnPlaylists: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PlaylistView = {
  id: string;
  userId: string;
  userName: string;
  name: string;
  type: PlaylistType;
  serverUrl: string;
  username: string;
  endpointHost: string;
  hasSecret: boolean;
  hasEpg: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LineView = {
  id: string;
  name: string;
  mac: string;
  userId: string;
  userName: string;
  playlistId: string;
  playlistName: string;
  status: LineStatus;
  expiresAt: string;
  lastSeenAt: string | null;
  lastDeviceName: string;
  createdAt: string;
  updatedAt: string;
};

export type PlayerPlaylist = {
  id: string;
  name: string;
  type: PlaylistType;
  serverUrl: string;
  username: string;
  password: string;
  epgUrl: string | null;
};

export type PlayerActivationResponse = {
  line: {
    id: string;
    name: string;
    status: LineStatus;
    expiresAt: string;
  };
  playlist: PlayerPlaylist;
};

export type OverviewStats = {
  totalUsers: number;
  activeUsers: number;
  expiringSoon: number;
  disabledUsers: number;
  playlists: number;
  lines: number;
  activeLines: number;
  devices: number;
  onlineDevices: number;
};

export type AdminSessionView = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin";
};

export type OverviewResponse = {
  stats: OverviewStats;
  recentUsers: AdminUser[];
  recentAudit: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
  }>;
  storage: string;
};
