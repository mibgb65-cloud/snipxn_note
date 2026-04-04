export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type NoteStackParamList = {
  Workspace: undefined;
  NoteEditor: { noteId: string };
};

export type CommunityStackParamList = {
  Feed: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};

export type MainTabParamList = {
  NotesTab: undefined;
  CommunityTab: undefined;
  SettingsTab: undefined;
};

export type MainDrawerParamList = {
  Workspace: undefined;
  Community: undefined;
  Settings: undefined;
};
