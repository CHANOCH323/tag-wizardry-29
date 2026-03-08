/**
 * API Client for external server
 * Configure VITE_API_URL in your environment to point to your server
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Token storage
let accessToken: string | null = localStorage.getItem("access_token");

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken() {
  setAccessToken(null);
}

// Generic API invoker
async function invoke<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = "GET", body, params } = options;

  const url = new URL(`${API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const init: RequestInit = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), init);

  // Handle 401 - clear token and redirect
  if (res.status === 401) {
    clearAccessToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || `API error ${res.status}`);
  }

  return data as T;
}

// ---- Types ----
export type {
  TagDto,
  CubeDto,
  CubeEntryDto,
  ProfileDto,
  ProfileListItemDto,
  VersionDto,
  SaveTagRequest,
  UpdateProfileRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "./api.types";

import type {
  TagDto,
  CubeDto,
  ProfileDto,
  ProfileListItemDto,
  VersionDto,
  SaveTagRequest,
  UpdateProfileRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "./api.types";

// ---- Auth ----

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await invoke<LoginResponse>("/auth/login", {
    method: "POST",
    body: request,
  });
  setAccessToken(response.token);
  return response;
}

export async function register(request: RegisterRequest): Promise<RegisterResponse> {
  const response = await invoke<RegisterResponse>("/auth/register", {
    method: "POST",
    body: request,
  });
  setAccessToken(response.token);
  return response;
}

export async function logout(): Promise<void> {
  try {
    await invoke("/auth/logout", { method: "POST" });
  } finally {
    clearAccessToken();
  }
}

// ---- Tags ----

export async function fetchTags(): Promise<TagDto[]> {
  return invoke<TagDto[]>("/tags");
}

export async function saveTag(
  request: SaveTagRequest
): Promise<{ success: boolean; tag_id: string }> {
  return invoke("/tags", { method: "POST", body: request });
}

export async function deleteTag(id: string): Promise<void> {
  await invoke(`/tags/${id}`, { method: "DELETE" });
}

// ---- Tag Versions ----

export async function fetchTagVersions(tagId: string): Promise<VersionDto[]> {
  return invoke<VersionDto[]>(`/tags/${tagId}/versions`);
}

export async function fetchLatestVersion(tagId: string): Promise<VersionDto> {
  return invoke<VersionDto>(`/tags/${tagId}/latest`);
}

// ---- Cubes ----

export async function fetchCubes(): Promise<CubeDto[]> {
  return invoke<CubeDto[]>("/cubes");
}

// ---- Profiles ----

export async function fetchCurrentProfile(): Promise<ProfileDto> {
  return invoke<ProfileDto>("/profile");
}

export async function fetchAllProfiles(): Promise<ProfileListItemDto[]> {
  return invoke<ProfileListItemDto[]>("/profiles");
}

export async function updateProfile(data: UpdateProfileRequest): Promise<ProfileDto> {
  return invoke<ProfileDto>("/profile", { method: "PATCH", body: data });
}

export async function updatePassword(newPassword: string): Promise<void> {
  await invoke("/auth/password", { method: "PUT", body: { password: newPassword } });
}

// ---- File Upload ----

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);
  formData.append("path", path);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Upload failed");
  }

  return res.json();
}
