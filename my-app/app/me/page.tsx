import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MeInteractiveDisplay from './MeInteractiveDisplay'

interface VotedCaption {
    id: string;
    vote_value: number;
    created_datetime_utc: string;
    captions: {
        id: string;
        content: string;
        like_count: number;
        images: {
            id: string;
            url: string;
        } | null;
    } | null;
}

export default async function MePage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ filter?: string }> }) {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/auth')
    }

    const searchParams = await searchParamsPromise; // Await the promise here

    // Fetch ALL voted captions first
    const { data: allVotedCaptions, error: fetchError } = await supabase
        .from('caption_votes')
        .select(`
      id,
      vote_value,
      created_datetime_utc,
      captions (
        id,
        content,
        like_count,
        images (
          id,
          url
        )
      )
    `)
        .eq('profile_id', user.id)
        .order('created_datetime_utc', { ascending: false })

    if (fetchError) {
        console.error('Error fetching all voted captions:', fetchError)
        // Handle error gracefully, perhaps return an error message to the user
        return <p>Error loading voted captions.</p>
    }

    const typedAllVotedCaptions: VotedCaption[] = allVotedCaptions as VotedCaption[]

    // Calculate stats from ALL voted captions
    const totalVotes = typedAllVotedCaptions?.length || 0
    const upvotes = typedAllVotedCaptions?.filter((vote) => vote.vote_value > 0).length || 0
    const downvotes = typedAllVotedCaptions?.filter((vote) => vote.vote_value < 0).length || 0

    const activeFilter: 'upvotes' | 'downvotes' | 'all' = (searchParams.filter as 'upvotes' | 'downvotes' | 'all') || 'upvotes'


    let filteredCaptionsForDisplay: VotedCaption[] = []
    if (activeFilter === 'upvotes') {
        filteredCaptionsForDisplay = typedAllVotedCaptions?.filter(vote => vote.vote_value > 0) || []
    } else if (activeFilter === 'downvotes') {
        filteredCaptionsForDisplay = typedAllVotedCaptions?.filter(vote => vote.vote_value < 0) || []
    } else { // 'all'
        filteredCaptionsForDisplay = typedAllVotedCaptions || []
    }


    return (
        <MeInteractiveDisplay
            user={user}
            initialVotedCaptions={filteredCaptionsForDisplay}
            totalVotes={totalVotes}
            upvotes={upvotes}
            downvotes={downvotes}
            initialActiveFilter={activeFilter}
        />
    )
}