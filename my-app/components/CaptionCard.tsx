"use client";

import { VoteType } from "@/types";
import { User } from "@supabase/supabase-js";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { upsertVote } from "@/app/actions";

interface Caption {
  id: string;
  content: string;
  like_count: number;
  user_vote?: VoteType;
}

interface CaptionCardProps {
  caption: Caption;
  user: User | null;
}

export function CaptionCard({ caption, user }: CaptionCardProps) {
  const router = useRouter();
  const [localUserVote, setLocalUserVote] = useState<VoteType>(caption.user_vote || VoteType.NONE);
  const [localLikeCount, setLocalLikeCount] = useState<number>(caption.like_count);

  useEffect(() => {
    setLocalUserVote(caption.user_vote || VoteType.NONE);
    setLocalLikeCount(caption.like_count);
  }, [caption.user_vote, caption.like_count]);

  const handleVote = async (captionId: string, voteValue: 1 | -1) => {
    if (!user) {
      console.log("User not logged in. Redirecting to auth page.");
      router.push("/auth");
      return;
    }

    const previousUserVote = localUserVote;
    const previousLikeCount = localLikeCount;

    // Optimistic UI update
    let newLikeCount = localLikeCount;
    let newUserVote = VoteType.NONE;

    if (previousUserVote === VoteType.NONE) {
      // No previous vote, new vote
      newLikeCount += voteValue;
      newUserVote = voteValue === 1 ? VoteType.UPVOTE : VoteType.DOWNVOTE;
    } else if (previousUserVote === VoteType.UPVOTE) {
      if (voteValue === 1) {
        // Unvoting an upvote
        newLikeCount -= 1;
        newUserVote = VoteType.NONE;
      } else {
        // Changing from upvote to downvote
        newLikeCount -= 2;
        newUserVote = VoteType.DOWNVOTE;
      }
    } else if (previousUserVote === VoteType.DOWNVOTE) {
      if (voteValue === -1) {
        // Unvoting a downvote
        newLikeCount += 1;
        newUserVote = VoteType.NONE;
      } else {
        // Changing from downvote to upvote
        newLikeCount += 2;
        newUserVote = VoteType.UPVOTE;
      }
    }

    setLocalLikeCount(newLikeCount);
    setLocalUserVote(newUserVote);

    const { error } = await upsertVote(captionId, user.id, voteValue);

    if (error) {
      console.error("Error submitting vote:", error);
      // Revert UI on error
      setLocalLikeCount(previousLikeCount);
      setLocalUserVote(previousUserVote);
      // Optionally, show an error message to the user
    } else {
      router.refresh(); // Refresh the current route to re-fetch data for eventual consistency
    }
  };

  return (
    <div
      key={caption.id}
      className="flex-none w-64 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow snap-center"
    >
      <p className="text-gray-800 dark:text-gray-200 text-base mb-2">
        {caption.content}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Likes: {localLikeCount}
      </p>
      {user && (
        <div className="flex justify-around mt-3">
          <button
            onClick={() => handleVote(caption.id, 1)}
            className={`px-3 py-1 rounded-md text-sm ${
              localUserVote === VoteType.UPVOTE
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
            }`}
          >
            👍 Upvote
          </button>
          <button
            onClick={() => handleVote(caption.id, -1)}
            className={`px-3 py-1 rounded-md text-sm ${
              localUserVote === VoteType.DOWNVOTE
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
            }`}
          >
            👎 Downvote
          </button>
        </div>
      )}
    </div>
  );
}