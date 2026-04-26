import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type NoteStackParamList = {
  Workspace: undefined;
  NoteEditor: { noteId: string };
};

export type SearchStackParamList = {
  Search: undefined;
  NoteEditor: { noteId: string };
};

export type CommunityStackParamList = {
  Feed: undefined;
  CreatePost: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};

export type MainTabParamList = {
  NotesTab: undefined;
  SearchTab: undefined;
  NewTab: undefined;
  CommunityTab: undefined;
  SettingsTab: undefined;
};

export type MainDrawerParamList = {
  Workspace: NavigatorScreenParams<NoteStackParamList> | undefined;
  Community: NavigatorScreenParams<CommunityStackParamList> | undefined;
  Settings: undefined;
};
