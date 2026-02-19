"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function upsertVote(
    captionId: string,
    userId: string,
    voteValue: 1 | -1
) {
  const supabase = await createClient();

  try {
    // Step 1: Check existing vote
    const { data: existingVote, error: fetchError } = await supabase
        .from("caption_votes")
        .select("id, vote_value")
        .eq("caption_id", captionId)
        .eq("profile_id", userId)
        .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching existing vote:", fetchError);
      return { error: fetchError.message };
    }

    // Step 2: Perform vote operation
    if (existingVote) {
      if (existingVote.vote_value === voteValue) {
        // Remove vote
        const { error: deleteError } = await supabase
            .from("caption_votes")
            .delete()
            .eq("id", existingVote.id);

        if (deleteError) {
          console.error("Error deleting vote:", deleteError);
          return { error: deleteError.message };
        }
      } else {
        // Change vote
        const { error: updateError } = await supabase
            .from("caption_votes")
            .update({
              vote_value: voteValue,
              modified_datetime_utc: new Date().toISOString()
            })
            .eq("id", existingVote.id);

        if (updateError) {
          console.error("Error updating vote:", updateError);
          return { error: updateError.message };
        }
      }
    } else {
      // Insert new vote
      const { error: insertError } = await supabase
          .from("caption_votes")
          .insert({
            caption_id: captionId,
            profile_id: userId,
            vote_value: voteValue,
            created_datetime_utc: new Date().toISOString(),
          });

      if (insertError) {
        console.error("Error inserting vote:", insertError);
        return { error: insertError.message };
      }
    }

    // Step 3: Recalculate like_count from scratch (prevents double counting)
    const { data: voteSum, error: sumError } = await supabase
        .from("caption_votes")
        .select("vote_value")
        .eq("caption_id", captionId);

    if (sumError) {
      console.error("Error calculating vote sum:", sumError);
      return { error: sumError.message };
    }

    // Calculate total from all votes
    const totalLikes = voteSum?.reduce((sum, vote) => sum + vote.vote_value, 0) || 0;

    // Update caption with recalculated count
    const { error: updateCaptionError } = await supabase
        .from("captions")
        .update({ like_count: totalLikes })
        .eq("id", captionId);

    if (updateCaptionError) {
      console.error("Error updating caption like count:", updateCaptionError);
      return { error: updateCaptionError.message };
    }

    revalidatePath("/");
    return { success: true, newLikeCount: totalLikes };

  } catch (error) {
    console.error("Unexpected error in upsertVote:", error);
    return { error: "An unexpected error occurred" };
  }
}