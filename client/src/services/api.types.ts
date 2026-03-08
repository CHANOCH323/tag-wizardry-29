/**
 * API Types / DTOs
 * These define the contract between client and server
 */

// ---- Auth ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
  profile: ProfileDto;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  display_name: string;
}

export interface RegisterResponse {
  token: string;
  user: UserDto;
  profile: ProfileDto;
}

export interface UserDto {
  id: string;
  email: string;
}

// ---- Profile ----

export interface ProfileDto {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  font_size: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileListItemDto {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface UpdateProfileRequest {
  display_name?: string;
  avatar_url?: string | null;
  font_size?: string;
}

// ---- Tags ----

export interface TagDto {
  id: string;
  question: string;
  answer_type: "cubes" | "free_text";
  cubes: CubeEntryDto[] | null;
  free_text_content: string | null;
  is_draft: boolean;
  last_editor: string | null;
  updated_at: string;
  created_at: string;
  version_count: number;
}

export interface CubeEntryDto {
  cube_id: string;
  cube_name: string;
  weight: number;
}

export interface SaveTagRequest {
  tag_id?: string | null;
  question: string;
  answer_type: "cubes" | "free_text";
  free_text_content: string;
  cubes: CubeEntryDto[];
  top_x: number;
  total_weight_threshold: number;
  is_draft: boolean;
}

// ---- Cubes ----

export interface CubeDto {
  id: string;
  cube_id: string;
  name: string;
}

// ---- Versions ----

export interface VersionDto {
  id: string;
  question: string;
  answer_type: "cubes" | "free_text";
  cubes: CubeEntryDto[] | null;
  free_text_content: string | null;
  top_x: number | null;
  total_weight_threshold: number | null;
  is_draft: boolean;
  changed_fields: string[] | null;
  created_at: string;
  created_by: string;
  editor_name: string | null;
}
