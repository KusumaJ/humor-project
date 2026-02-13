// app/me/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from './signoutbutton'
import Link from 'next/link'

export default async function MePage() {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/auth')
    }

    // 1. User's liked captions
    const { data: likedCaptions } = await supabase
        .from('caption_likes')
        .select(`
      id,
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

    // 2. User's voted captions
    const { data: votedCaptions } = await supabase
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

    // 3. User's saved captions (bookmarks)
    const { data: savedCaptions } = await supabase
        .from('caption_saved')
        .select(`
      id,
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

    // 4. User's own created captions
    const { data: myCreatedCaptions } = await supabase
        .from('captions')
        .select(`
      id,
      content,
      like_count,
      created_datetime_utc,
      is_public,
      is_featured,
      images (
        id,
        url
      )
    `)
        .eq('profile_id', user.id)
        .order('created_datetime_utc', { ascending: false })
        .limit(20)

    // 5. User's uploaded images
    const { data: myImages } = await supabase
        .from('images')
        .select(`
      id,
      url,
      created_datetime_utc,
      is_public,
      captions (
        id,
        content,
        like_count
      )
    `)
        .eq('profile_id', user.id)
        .order('created_datetime_utc', { ascending: false })
        .limit(12)

    // 6. User's caption requests
    const { data: myRequests } = await supabase
        .from('caption_requests')
        .select(`
      id,
      created_datetime_utc,
      images (
        id,
        url
      ),
      captions (
        id,
        content,
        like_count
      )
    `)
        .eq('profile_id', user.id)
        .order('created_datetime_utc', { ascending: false })
        .limit(10)

    // 7. User's screenshots (captions they've screenshotted)
    const { data: screenshots } = await supabase
        .from('screenshots')
        .select(`
      id,
      created_datetime_utc,
      captions (
        id,
        content,
        images (
          url
        )
      )
    `)
        .eq('profile_id', user.id)
        .order('created_datetime_utc', { ascending: false })

    // 8. User's shares
    const { data: shares } = await supabase
        .from('shares')
        .select(`
      id,
      created_datetime_utc,
      proper_destination,
      share_to_destinations (
        name
      ),
      captions (
        id,
        content,
        images (
          url
        )
      )
    `)
        .eq('profile_id', user.id)
        .order('created_datetime_utc', { ascending: false })

    // Calculate stats
    const totalLikes = likedCaptions?.length || 0
    const totalVotes = votedCaptions?.length || 0
    const totalSaved = savedCaptions?.length || 0
    const totalCreated = myCreatedCaptions?.length || 0
    const totalUploads = myImages?.length || 0
    const totalLikesReceived = myCreatedCaptions?.reduce((sum, c) => sum + (c.like_count || 0), 0) || 0

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
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalLikes}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalVotes}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Votes</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalSaved}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Saved</div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalCreated}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Created</div>
                        </div>
                        <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{totalUploads}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Uploads</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalLikesReceived}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Likes Received</div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Link
                            href="/"
                            className="text-blue-500 hover:underline"
                        >
                            ← Back to Browse Memes
                        </Link>
                    </div>
                </div>

                {/* Tabs or Sections */}
                <div className="space-y-8">

                    {/* My Created Captions */}
                    {totalCreated > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
                                🎨 My Captions ({totalCreated})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myCreatedCaptions?.map((caption: any) => (
                                    <div key={caption.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                                        {caption.images?.url && (
                                            <div className="relative w-full h-48 mb-4">
                                                <img
                                                    src={caption.images.url}
                                                    alt="Meme"
                                                    className="rounded-md w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <p className="text-gray-800 dark:text-gray-200 mb-2 font-medium">
                                            {caption.content}
                                        </p>
                                        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                            <span>❤️ {caption.like_count} likes</span>
                                            <div className="flex gap-2">
                                                {caption.is_featured && <span className="text-yellow-500">⭐ Featured</span>}
                                                {caption.is_public ? <span>🌍 Public</span> : <span>🔒 Private</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* My Uploaded Images */}
                    {totalUploads > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
                                📸 My Uploaded Images ({totalUploads})
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {myImages?.map((image: any) => (
                                    <div key={image.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                                        <div className="relative w-full h-48">
                                            <img
                                                src={image.url}
                                                alt="Uploaded"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {image.captions?.length || 0} captions
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-500">
                                                {new Date(image.created_datetime_utc).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Saved Captions */}
                    {totalSaved > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
                                🔖 Saved Captions ({totalSaved})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {savedCaptions?.map((saved: any) => (
                                    <div key={saved.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                                        {saved.captions?.images?.url && (
                                            <div className="relative w-full h-48 mb-4">
                                                <img
                                                    src={saved.captions.images.url}
                                                    alt="Meme"
                                                    className="rounded-md w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <p className="text-gray-800 dark:text-gray-200 mb-2">
                                            {saved.captions?.content}
                                        </p>
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                            <span>❤️ {saved.captions?.like_count} likes</span>
                                            <span>Saved {new Date(saved.created_datetime_utc).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Liked Captions */}
                    {totalLikes > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
                                ❤️ Liked Captions ({totalLikes})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {likedCaptions?.map((like: any) => (
                                    <div key={like.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                                        {like.captions?.images?.url && (
                                            <div className="relative w-full h-48 mb-4">
                                                <img
                                                    src={like.captions.images.url}
                                                    alt="Meme"
                                                    className="rounded-md w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <p className="text-gray-800 dark:text-gray-200 mb-2">
                                            {like.captions?.content}
                                        </p>
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                            <span>❤️ {like.captions?.like_count} likes</span>
                                            <span>{new Date(like.created_datetime_utc).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Voted Captions */}
                    {totalVotes > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
                                🗳️ Voted Captions ({totalVotes})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {votedCaptions?.map((vote: any) => (
                                    <div key={vote.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                                        {vote.captions?.images?.url && (
                                            <div className="relative w-full h-48 mb-4">
                                                <img
                                                    src={vote.captions.images.url}
                                                    alt="Meme"
                                                    className="rounded-md w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <p className="text-gray-800 dark:text-gray-200 mb-2">
                                            {vote.captions?.content}
                                        </p>
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                            <span>{vote.vote_value > 0 ? '👍' : '👎'} Vote: {vote.vote_value}</span>
                                            <span>{new Date(vote.created_datetime_utc).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Screenshots */}
                    {screenshots && screenshots.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
                                📱 Screenshots ({screenshots.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {screenshots.map((screenshot: any) => (
                                    <div key={screenshot.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                                        {screenshot.captions?.images?.url && (
                                            <div className="relative w-full h-48 mb-4">
                                                <img
                                                    src={screenshot.captions.images.url}
                                                    alt="Meme"
                                                    className="rounded-md w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <p className="text-gray-800 dark:text-gray-200 mb-2">
                                            {screenshot.captions?.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Empty State */}
                    {totalLikes === 0 && totalVotes === 0 && totalSaved === 0 && totalCreated === 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                                What a shame, GO START YOUR HUMOR JOURNEY!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                You haven't interacted with any memes yet. Start exploring and voting!
                            </p>
                            <Link
                                href="http://humorstudy.org"
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