// DTO types returned by the API layer

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

export interface CubeDto {
  id: string;
  cube_id: string;
  name: string;
}

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

export interface UpdateProfileRequest {
  display_name?: string;
  avatar_url?: string | null;
  font_size?: string;
}
