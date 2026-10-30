export type UserStatus = "active" | "disabled";
export type PlaylistType = "xtream" | "m3u";
export type PlaylistStatus = "active" | "disabled";
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
  status: PlaylistStatus;
  ownerLineId: string | null;
  assignedLineIds: string[];
  assignedLineNames: string[];
  serverUrl: string;
  username: string;
  password: string;
  m3uUrl: string;
  endpointHost: string;
  hasSecret: boolean;
  hasEpg: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LinePlaylistView = {
  id: string;
  name: string;
  type: PlaylistType;
  status: PlaylistStatus;
};

export type LineView = {
  id: string;
  name: string;
  mac: string;
  userId: string;
  userName: string;
  playlistId: string;
  playlistName: string;
  playlists: LinePlaylistView[];
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
  m3uUrl: string | null;
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
  playlists: PlayerPlaylist[];
};

export type PortalLineView = {
  id: string;
  name: string;
  mac: string;
  status: LineStatus;
  expiresAt: string;
  userName: string;
  allowOwnPlaylists: boolean;
  lastSeenAt: string | null;
  lastDeviceName: string;
};

export type PortalPlaylistView = {
  id: string;
  name: string;
  type: PlaylistType;
  status: PlaylistStatus;
  endpointHost: string;
  serverUrl: string;
  username: string;
  password: string;
  m3uUrl: string;
  hasEpg: boolean;
  owner: boolean;
  primary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PortalMeResponse = {
  line: PortalLineView;
  playlists: PortalPlaylistView[];
};

export type CaptchaChallenge = {
  image: string;
  token: string;
  debugAnswer?: string;
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
