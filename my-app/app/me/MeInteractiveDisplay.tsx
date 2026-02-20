'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import SignOutButton from './signoutbutton'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { VotedCaption } from '@/types'

interface User {
    id: string;
    email?: string | null;
}

interface MeInteractiveDisplayProps {
    user: User;
    initialVotedCaptions: VotedCaption[] | null;
    totalVotes: number;
    upvotes: number;
    downvotes: number;
    initialActiveFilter: 'upvotes' | 'downvotes' | 'all';
}

export default function MeInteractiveDisplay({
                                                 user,
                                                 initialVotedCaptions,
                                                 totalVotes,
                                                 upvotes,
                                                 downvotes,
                                                 initialActiveFilter,
                                             }: MeInteractiveDisplayProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const activeFilter = initialActiveFilter

    const supabase = useMemo(() => {
        return createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }, [])

    const handleFilterClick = (filter: 'upvotes' | 'downvotes' | 'all') => {
        const current = new URLSearchParams(Array.from(searchParams.entries()))
        current.set('filter', filter)
        router.push(`?${current.toString()}`)
    }

    const sectionTitle = useMemo(() => {
        if (activeFilter === 'upvotes') {
            return `⭐ Your Favorites (${upvotes})`
        } else if (activeFilter === 'downvotes') {
            return `👎 Your Downvotes (${downvotes})`
        }
        return `🗳️ Your Total Votes (${totalVotes})`
    }, [activeFilter, upvotes, downvotes, totalVotes])

    const handleUnvote = async (voteId: number) => {  // Changed to number
        const { error: deleteError } = await supabase
            .from('caption_votes')
            .delete()
            .eq('id', voteId)

        if (deleteError) {
            console.error('Error unvoting:', deleteError)
            alert('Failed to unvote. Please try again.')
        } else {
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-black dark:text-white">
                                Your Personal Humor Collection
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                {user.email}
                            </p>
                        </div>
                        <SignOutButton />
                    </div>

                    {/* Stats Grid */}
                    <div className="flex gap-4 mt-6 justify-center">
                        <div
                            className={`bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center w-48 cursor-pointer transition-all ${
                                activeFilter === 'all' ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-300'
                            }`}
                            onClick={() => handleFilterClick('all')}
                        >
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalVotes}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Votes</div>
                        </div>
                        <div
                            className={`bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center w-48 cursor-pointer transition-all ${
                                activeFilter === 'upvotes' ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-300'
                            }`}
                            onClick={() => handleFilterClick('upvotes')}
                        >
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{upvotes}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Upvotes</div>
                        </div>
                        <div
                            className={`bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center w-48 cursor-pointer transition-all ${
                                activeFilter === 'downvotes' ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-300'
                            }`}
                            onClick={() => handleFilterClick('downvotes')}
                        >
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{downvotes}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Downvotes</div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Link href="/" className="text-blue-500 hover:underline">
                            ← Back to Browse Memes
                        </Link>
                    </div>
                </div>

                {/* Voted Captions Section */}
                <div className="space-y-8">
                    {initialVotedCaptions && initialVotedCaptions.length > 0 ? (
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
                                {sectionTitle}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {initialVotedCaptions.map((vote) => (
                                    <div key={vote.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                                        {vote.captions?.images?.url && (
                                            <div className="relative h-48 mb-4 flex items-center justify-center">
                                                <img
                                                    src={vote.captions.images.url}
                                                    alt="Meme"
                                                    className="rounded-md h-full object-contain max-w-full"
                                                />
                                            </div>
                                        )}
                                        <p className="text-gray-800 dark:text-gray-200 mb-2">
                                            {vote.captions?.content}
                                        </p>
                                        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                            <span>{vote.vote_value > 0 ? '👍 Upvoted' : '👎 Downvoted'}</span>
                                            <button
                                                onClick={() => handleUnvote(vote.id)}
                                                className="text-blue-500 hover:text-blue-700 text-xs"
                                            >
                                                Unvote
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                                No {activeFilter === 'upvotes' ? 'favorites' : activeFilter === 'downvotes' ? 'downvotes' : 'votes'} yet!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Start exploring and voting to build your collection.
                            </p>
                            <Link
                                href="/"
                                className="inline-block px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium"
                            >
                                Browse Memes
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}