export interface Team {
  id: number;
  name: string;
}

export interface TeamMemberResponse {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  role: string;
  email: string;
}
