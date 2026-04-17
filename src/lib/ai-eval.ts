/**
 * AI Evaluation Stub
 * --------------------
 * Future: This will call an LLM/vision model with the assessment video URL,
 * apply the rubric, and populate ai_score_json on the assessments row.
 *
 * For now: returns a deterministic mock score and updates the DB.
 * Designed so that swapping in a real implementation only changes this file.
 */

import { supabase } from "@/integrations/supabase/client";

export interface AiRubric {
  task_done_correctly: boolean;
  safety: number; // 1-5
  neatness: number; // 1-5
  clarity: number; // 1-5
  comments: string;
  raw_model_output?: unknown;
}

export interface AiEvalResult {
  rubric: AiRubric;
  level: 1 | 2 | 3;
  capabilities: string[];
}

export function levelFromRubric(rubric: {
  task_done_correctly: boolean;
  safety: number;
  neatness: number;
}): 1 | 2 | 3 {
  if (!rubric.task_done_correctly) return 1;
  const avg = (rubric.safety + rubric.neatness) / 2;
  if (avg >= 4.5) return 3;
  if (avg >= 3.5) return 2;
  return 1;
}

export async function runAiAssessment(assessmentId: string): Promise<AiEvalResult> {
  const { data: a, error } = await supabase
    .from("assessments")
    .select("trade, video_url")
    .eq("id", assessmentId)
    .single();
  if (error || !a) throw new Error("Assessment not found");

  // ---- STUB: deterministic mock rubric ----
  const rubric: AiRubric = {
    task_done_correctly: true,
    safety: 4,
    neatness: 4,
    clarity: 4,
    comments: "AI stub: video processed (mock). Replace with real LLM call.",
  };
  const level = levelFromRubric(rubric);
  const capabilities = capabilitiesForTrade(a.trade as string, level);
  // -----------------------------------------

  await supabase
    .from("assessments")
    .update({ ai_score_json: rubric as unknown as Record<string, unknown> })
    .eq("id", assessmentId);

  return { rubric, level, capabilities };
}

export function capabilitiesForTrade(trade: string, level: 1 | 2 | 3): string[] {
  const map: Record<string, string[][]> = {
    electrician: [
      ["Basic wiring", "Switchboards"],
      ["Wiring", "Safety protocols", "3-phase systems"],
      ["Industrial wiring", "Inverter systems", "PLC basics", "Fault diagnosis"],
    ],
    plumber: [
      ["Tap repair", "Pipe joining"],
      ["Leak fixing", "Sanitary fitting", "Geyser install"],
      ["Concealed plumbing", "Pressure systems", "Drainage design"],
    ],
    welder: [
      ["Tack welds", "Basic cuts"],
      ["Butt welds", "Fillet welds", "Safety gear"],
      ["TIG/MIG", "Pipe welding", "Structural welds"],
    ],
    carpenter: [
      ["Basic joinery", "Measuring"],
      ["Dovetail joints", "Furniture finishing"],
      ["Modular furniture", "Veneering", "CNC basics"],
    ],
    ac_tech: [
      ["AC cleaning", "Basic install"],
      ["Gas charging", "Fault finding", "Installation"],
      ["VRV systems", "Inverter ACs", "Refrigeration cycles"],
    ],
  };
  return map[trade]?.[level - 1] ?? [];
}
