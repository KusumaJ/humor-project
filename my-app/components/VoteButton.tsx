// components/VoteButton.tsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface VoteButtonProps {
    captionId: string
    currentVoteValue?: number | null  // User's existing vote (if any)
    isAuthenticated: boolean
}

export default function VoteButton({
                                       captionId,
                                       currentVoteValue,
                                       isAuthenticated
                                   }: VoteButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [voteValue, setVoteValue] = useState(currentVoteValue)
    const router = useRouter()
    const supabase = createClient()

    const handleVote = async (value: number) => {
        // Redirect to login if not authenticated
        if (!isAuthenticated) {
            router.push('/auth')
            return
        }

        setIsLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/auth')
                return
            }

            // Check if user already voted
            const { data: existingVote } = await supabase
                .from('caption_votes')
                .select('id, vote_value')
                .eq('profile_id', user.id)
                .eq('caption_id', captionId)
                .single()

            if (existingVote) {
                // Update existing vote
                if (existingVote.vote_value === value) {
                    // Same vote - remove it (toggle off)
                    const { error } = await supabase
                        .from('caption_votes')
                        .delete()
                        .eq('id', existingVote.id)

                    if (error) throw error
                    setVoteValue(null)
                } else {
                    // Different vote - update it
                    const { error } = await supabase
                        .from('caption_votes')
                        .update({
                            vote_value: value,
                            modified_datetime_utc: new Date().toISOString()
                        })
                        .eq('id', existingVote.id)

                    if (error) throw error
                    setVoteValue(value)
                }
            } else {
                // Create new vote
                const { error } = await supabase
                    .from('caption_votes')
                    .insert({
                        profile_id: user.id,
                        caption_id: captionId,
                        vote_value: value,
                        created_datetime_utc: new Date().toISOString()
                    })

                if (error) throw error
                setVoteValue(value)
            }

            // Refresh the page to show updated data
            router.refresh()
        } catch (error) {
            console.error('Error voting:', error)
            alert('Failed to vote. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex gap-2 items-center">
            <button
                onClick={() => handleVote(1)}
                disabled={isLoading}
                className={`px-3 py-1 rounded-md transition-colors ${
                    voteValue === 1
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-900/30'
                } disabled:opacity-50`}
            >
                👍 {voteValue === 1 ? 'Upvoted' : 'Upvote'}
            </button>

            <button
                onClick={() => handleVote(-1)}
                disabled={isLoading}
                className={`px-3 py-1 rounded-md transition-colors ${
                    voteValue === -1
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30'
                } disabled:opacity-50`}
            >
                👎 {voteValue === -1 ? 'Downvoted' : 'Downvote'}
            </button>
        </div>
    )
}