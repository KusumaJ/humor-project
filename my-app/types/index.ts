export enum VoteType {
    NONE = 0,
    UPVOTE = 1,
    DOWNVOTE = -1,
}

export interface VotedCaption {
    id: number  // Changed from string to number (matches database)
    vote_value: number
    created_datetime_utc: string
    captions: {  // Single object, not array
        id: string
        content: string
        like_count: number
        images: {  // Single object, not array
            id: string
            url: string
        }
    }
}

// types/index.ts
// This matches EXACTLY what Supabase returns (from your logs)
export interface VotedCaption {
    id: number
    vote_value: number
    created_datetime_utc: string
    captions: {
        id: string
        content: string
        like_count: number
        images: {
            id: string
            url: string
        }
    }
}
