import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function createAuthClient(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  return { supabase, token: authHeader.replace("Bearer ", "") };
}

async function getUserId(supabase: any, token: string): Promise<string> {
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) throw new Error("Unauthorized");
  return data.claims.sub;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabase, token } = createAuthClient(req);
    const userId = await getUserId(supabase, token);
    const url = new URL(req.url);

    // GET /tags-api — list tags with DTOs
    if (req.method === "GET") {
      const { data: tagsData, error: tagsErr } = await supabase
        .from("tags")
        .select("id, created_at, updated_at")
        .eq("is_deleted", false)
        .order("updated_at", { ascending: false });

      if (tagsErr) throw tagsErr;
      if (!tagsData || tagsData.length === 0) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tagIds = tagsData.map((t: any) => t.id);

      const { data: versions, error: vErr } = await supabase
        .from("tag_versions")
        .select("*")
        .in("tag_id", tagIds)
        .order("created_at", { ascending: false });

      if (vErr) throw vErr;

      const userIds = [...new Set((versions || []).map((v: any) => v.created_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p.display_name])
      );

      const versionsByTag = new Map<string, any[]>();
      for (const v of versions || []) {
        if (!versionsByTag.has(v.tag_id)) versionsByTag.set(v.tag_id, []);
        versionsByTag.get(v.tag_id)!.push(v);
      }

      const result = tagsData
        .map((tag: any) => {
          const tagVersions = versionsByTag.get(tag.id) || [];
          const latest = tagVersions[0];
          if (!latest) return null;
          return {
            id: tag.id,
            question: latest.question,
            answer_type: latest.answer_type,
            cubes: latest.cubes,
            free_text_content: latest.free_text_content,
            is_draft: latest.is_draft,
            last_editor: profileMap.get(latest.created_by) || null,
            updated_at: tag.updated_at,
            created_at: tag.created_at,
            version_count: tagVersions.length,
          };
        })
        .filter(Boolean);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /tags-api — create or update tag (new version)
    if (req.method === "POST") {
      const body = await req.json();
      const {
        tag_id,
        question,
        answer_type,
        free_text_content,
        cubes,
        top_x,
        total_weight_threshold,
        is_draft,
      } = body;

      let finalTagId = tag_id;
      const changedFields: string[] = [];

      if (!finalTagId) {
        // Create new tag
        const { data, error } = await supabase
          .from("tags")
          .insert({})
          .select("id")
          .single();
        if (error) throw error;
        finalTagId = data.id;
        changedFields.push("question", "answer");
      } else {
        // Detect changes
        const { data: prev } = await supabase
          .from("tag_versions")
          .select("question, answer_type, cubes, free_text_content")
          .eq("tag_id", finalTagId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (prev) {
          if (prev.question !== question) changedFields.push("question");
          if (
            prev.answer_type !== answer_type ||
            JSON.stringify(prev.cubes) !== JSON.stringify(cubes) ||
            prev.free_text_content !== free_text_content
          ) {
            changedFields.push("answer");
          }
        }
      }

      const { error: vError } = await supabase.from("tag_versions").insert({
        tag_id: finalTagId,
        created_by: userId,
        question,
        answer_type,
        free_text_content: answer_type === "free_text" ? free_text_content : null,
        cubes: answer_type === "cubes" ? cubes : null,
        top_x: answer_type === "cubes" ? top_x : null,
        total_weight_threshold:
          answer_type === "cubes" ? total_weight_threshold : null,
        is_draft: is_draft ?? false,
        changed_fields: changedFields,
      });
      if (vError) throw vError;

      await supabase
        .from("tags")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", finalTagId);

      return new Response(
        JSON.stringify({ success: true, tag_id: finalTagId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE /tags-api?id=xxx — soft delete
    if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("Missing tag id");

      const { error } = await supabase
        .from("tags")
        .update({ is_deleted: true })
        .eq("id", id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const status = error.message === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
