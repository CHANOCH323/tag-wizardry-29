import { supabase } from "@/integrations/supabase/client";
import type {
  TagDto,
  CubeDto,
  ProfileDto,
  ProfileListItemDto,
  VersionDto,
  SaveTagRequest,
  UpdateProfileRequest,
} from "./api.types";

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

async function invoke<T>(functionName: string, options: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}): Promise<T> {
  const token = await getAccessToken();
  const { method = "GET", body, params } = options;

  const url = new URL(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`
  );
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

  const init: RequestInit = { method, headers };
  if (body) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), init);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error ${res.status}`);
  }

  return data as T;
}

// ---- Tags ----

export async function fetchTags(): Promise<TagDto[]> {
  return invoke<TagDto[]>("tags-api");
}

export async function saveTag(request: SaveTagRequest): Promise<{ success: boolean; tag_id: string }> {
  return invoke("tags-api", { method: "POST", body: request });
}

export async function deleteTag(id: string): Promise<void> {
  await invoke("tags-api", { method: "DELETE", params: { id } });
}

// ---- Tag Versions ----

export async function fetchTagVersions(tagId: string): Promise<VersionDto[]> {
  return invoke<VersionDto[]>("tag-versions-api", { params: { tag_id: tagId } });
}

export async function fetchLatestVersion(tagId: string): Promise<VersionDto> {
  return invoke<VersionDto>("tag-versions-api", { params: { edit_tag_id: tagId } });
}

// ---- Cubes ----

export async function fetchCubes(): Promise<CubeDto[]> {
  return invoke<CubeDto[]>("get-cubes");
}

// ---- Profiles ----

export async function fetchCurrentProfile(): Promise<ProfileDto> {
  return invoke<ProfileDto>("profiles-api");
}

export async function fetchAllProfiles(): Promise<ProfileListItemDto[]> {
  return invoke<ProfileListItemDto[]>("profiles-api", { params: { list: "true" } });
}

export async function updateProfile(data: UpdateProfileRequest): Promise<ProfileDto> {
  return invoke<ProfileDto>("profiles-api", { method: "PATCH", body: data });
}
