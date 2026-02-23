// API Route: Get Quiz Questions (4-Layer System)
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get layer parameter (1-4)
    const layerParam = searchParams.get("layer");
    const branchParam = searchParams.get("branch"); // For Layer 3: EHNH, EHNL, ELNH, ELNL

    if (!layerParam) {
      return NextResponse.json(
        { error: "Layer parameter is required (1-4)" },
        { status: 400 },
      );
    }

    const layer = parseInt(layerParam);
    if (layer < 1 || layer > 4) {
      return NextResponse.json(
        { error: "Layer must be between 1 and 4" },
        { status: 400 },
      );
    }

    // Layer 3 requires branch_category
    if (layer === 3 && !branchParam) {
      return NextResponse.json(
        {
          error:
            "Branch parameter required for Layer 3 (EHNH, EHNL, ELNH, ELNL)",
        },
        { status: 400 },
      );
    }

    // Validate branch parameter
    if (layer === 3) {
      const validBranches = ["EHNH", "EHNL", "ELNH", "ELNL"];
      if (!validBranches.includes(branchParam as string)) {
        return NextResponse.json(
          { error: "Invalid branch. Must be one of: EHNH, EHNL, ELNH, ELNL" },
          { status: 400 },
        );
      }
    }

    // Build query
    let query = supabase
      .from("quiz_questions")
      .select(
        `
        id,
        question_text,
        layer,
        category,
        branch_category,
        order_number,
        juz_reference,
        ayat_reference,
        quiz_options (
          id,
          option_text,
          option_value,
          points,
          order_number
        )
      `,
      )
      .eq("layer", layer);

    // Add branch filter for Layer 3
    if (layer === 3) {
      query = query.eq("branch_category", branchParam);
    }

    // Layer 4 (tie-breaker) is handled by separate endpoint

    // Execute query
    const { data: questions, error } = await query.order("order_number", {
      ascending: true,
    });

    if (error) {
      console.error("Questions fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 },
      );
    }

    // Return layer-specific metadata
    return NextResponse.json(
      {
        layer,
        branch: layer === 3 ? branchParam : null,
        questions,
        total: questions?.length || 0,
        description: getLayerDescription(layer),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get questions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function getLayerDescription(layer: number): string {
  switch (layer) {
    case 1:
      return "Layer 1: Extraversion Assessment (11 questions) - Data collection only";
    case 2:
      return "Layer 2: Ego & Neuroticism (10 questions) - Determines your branch path";
    case 3:
      return "Layer 3: Branch-specific questions - Determines your Juz personality";
    case 4:
      return "Layer 4: Tie-breaker - Only shown if top 2 Juz scores are equal";
    default:
      return "Unknown layer";
  }
}
