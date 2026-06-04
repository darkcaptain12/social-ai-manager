/**
 * BUFFER API CLIENT
 * Buffer handles Instagram OAuth internally — no Facebook account needed.
 * Docs: https://buffer.com/developers/api
 */

const BUFFER_BASE = "https://api.bufferapp.com/1";

export interface BufferProfile {
  id: string;
  service: string;          // "instagram", "twitter", etc.
  service_username: string; // @handle
  formatted_username: string;
  avatar: string;
  statistics?: {
    followers: number;
  };
}

export interface BufferUpdate {
  id: string;
  status: "buffer" | "sent" | "failed";
  text: string;
  scheduled_at?: string;
  sent_at?: string;
  service_update_id?: string;
}

export interface BufferPostPayload {
  profileIds: string[];    // Buffer profile IDs to post to
  text: string;            // Caption
  mediaUrl?: string;       // Image URL (must be publicly accessible)
  scheduledAt?: string;    // ISO date string for scheduling
  now?: boolean;           // true = post immediately, false = add to queue
}

// ─── API HELPERS ──────────────────────────────────────────────────────────────

async function bufferFetch(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${BUFFER_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error || data.message || `Buffer API error: ${res.status}`
    );
  }

  return data;
}

function toFormData(obj: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(`${key}[]`, String(v)));
    } else if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  return params.toString();
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/** Verify token and return Buffer user info */
export async function getBufferUser(token: string) {
  return bufferFetch("/user.json", token);
}

/** Get all connected social profiles */
export async function getBufferProfiles(token: string): Promise<BufferProfile[]> {
  const data = await bufferFetch("/profiles.json", token);
  return Array.isArray(data) ? data : [];
}

/** Get only Instagram profiles */
export async function getInstagramProfiles(token: string): Promise<BufferProfile[]> {
  const profiles = await getBufferProfiles(token);
  return profiles.filter((p) => p.service === "instagram");
}

/** Post or schedule content via Buffer */
export async function createBufferPost(
  token: string,
  payload: BufferPostPayload
): Promise<BufferUpdate[]> {
  const body: Record<string, unknown> = {
    text: payload.text,
    profile_ids: payload.profileIds,
  };

  if (payload.mediaUrl) {
    body["media[photo]"] = payload.mediaUrl;
    body["media[thumbnail]"] = payload.mediaUrl;
  }

  if (payload.scheduledAt) {
    // Buffer expects Unix timestamp
    body["scheduled_at"] = Math.floor(
      new Date(payload.scheduledAt).getTime() / 1000
    ).toString();
    body["now"] = "false";
  } else if (payload.now) {
    body["now"] = "true";
  }
  // Default: add to queue

  const data = await bufferFetch("/updates/create.json", token, {
    method: "POST",
    body: toFormData(body),
  });

  return data.updates ?? [];
}

/** Get pending posts in Buffer queue */
export async function getBufferQueue(
  token: string,
  profileId: string
): Promise<BufferUpdate[]> {
  const data = await bufferFetch(
    `/profiles/${profileId}/updates/pending.json`,
    token
  );
  return data.updates ?? [];
}

/** Get sent posts */
export async function getBufferSent(
  token: string,
  profileId: string
): Promise<BufferUpdate[]> {
  const data = await bufferFetch(
    `/profiles/${profileId}/updates/sent.json`,
    token
  );
  return data.updates ?? [];
}

/** Delete a queued post */
export async function deleteBufferPost(
  token: string,
  updateId: string
): Promise<void> {
  await bufferFetch(`/updates/${updateId}/destroy.json`, token, {
    method: "POST",
    body: toFormData({ updateId }),
  });
}
