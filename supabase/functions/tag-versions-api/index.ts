import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const tagId = url.searchParams.get("tag_id");

    if (req.method === "GET" && tagId) {
      const { data: versions, error } = await supabase
        .from("tag_versions")
        .select("*")
        .eq("tag_id", tagId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((versions || []).map((v: any) => v.created_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p.display_name])
      );

      const result = (versions || []).map((v: any) => ({
        id: v.id,
        question: v.question,
        answer_type: v.answer_type,
        cubes: v.cubes,
        free_text_content: v.free_text_content,
        top_x: v.top_x,
        total_weight_threshold: v.total_weight_threshold,
        is_draft: v.is_draft,
        changed_fields: v.changed_fields,
        created_at: v.created_at,
        created_by: v.created_by,
        editor_name: profileMap.get(v.created_by) || null,
      }));

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET latest version for editing
    if (req.method === "GET" && !tagId) {
      const editTagId = url.searchParams.get("edit_tag_id");
      if (!editTagId) {
        return new Response(JSON.stringify({ error: "Missing tag_id or edit_tag_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("tag_versions")
        .select("*")
        .eq("tag_id", editTagId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
