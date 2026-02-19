import { createClient } from '@/utils/supabase/server'
import Link from "next/link";
import { CaptionCard } from "@/components/CaptionCard";
import { VoteType } from "@/types";

interface Caption {
  id: string;
  content: string;
  like_count: number;
  user_vote?: VoteType;
  image_id: string;
}

interface ImageWithCaptions {
  id: string;
  url: string;
  captions: Caption[];
  topCaptionLikes: number;
}

const ITEMS_PER_PAGE = 3;
const MAX_CAPTIONS_PER_IMAGE = 10;

export default async function Home({
                                     searchParams,
                                   }: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const currentPage = Number((await searchParams).page) || 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  let imagesWithCaptions: ImageWithCaptions[] = [];
  let totalUniqueImages = 0;

  try {
    // Step 1: Get top captions with likes (sorted by like_count)
    const { data: topCaptions, error: captionError } = await supabase
        .from('captions')
        .select(`
        id,
        content,
        like_count,
        image_id,
        images (
          id,
          url
        )
      `)
        .gt('like_count', 0)
        .order('like_count', { ascending: false })
        .limit(100)

    if (captionError) {
      console.error("Error fetching captions:", captionError);
    } else if (topCaptions && topCaptions.length > 0) {
      // Step 2: Group liked captions by image
      const imageMap = new Map<string, ImageWithCaptions>();

      topCaptions.forEach((caption: any) => {
        const imageId = caption.image_id;
        const imageUrl = caption.images?.url;

        if (!imageUrl) return;

        if (!imageMap.has(imageId)) {
          imageMap.set(imageId, {
            id: imageId,
            url: imageUrl,
            captions: [],
            topCaptionLikes: 0,
          });
        }

        const image = imageMap.get(imageId)!;

        // Add liked captions (we'll fill to 10 later)
        image.captions.push({
          id: caption.id,
          content: caption.content,
          like_count: caption.like_count,
          image_id: caption.image_id,
        });

        // Track the highest like count for sorting
        if (caption.like_count > image.topCaptionLikes) {
          image.topCaptionLikes = caption.like_count;
        }
      });

      // Step 3: Fill images to 10 captions if they have fewer
      const imageIds = Array.from(imageMap.keys());

      // Get all captions for these images (including ones with 0 likes)
      const { data: allCaptionsForImages } = await supabase
          .from('captions')
          .select('id, content, like_count, image_id')
          .in('image_id', imageIds)
          .order('like_count', { ascending: false })

      if (allCaptionsForImages) {
        // Group all captions by image
        const allCaptionsByImage = new Map<string, Caption[]>();
        allCaptionsForImages.forEach((caption: any) => {
          if (!allCaptionsByImage.has(caption.image_id)) {
            allCaptionsByImage.set(caption.image_id, []);
          }
          allCaptionsByImage.get(caption.image_id)!.push(caption);
        });

        // Fill each image to 10 captions
        imageMap.forEach((image, imageId) => {
          const allCaptions = allCaptionsByImage.get(imageId) || [];
          const existingCaptionIds = new Set(image.captions.map(c => c.id));

          // Add captions until we reach 10
          for (const caption of allCaptions) {
            if (image.captions.length >= MAX_CAPTIONS_PER_IMAGE) break;
            if (!existingCaptionIds.has(caption.id)) {
              image.captions.push(caption);
            }
          }
        });
      }

      // Step 4: Sort images by top caption likes
      const allImages = Array.from(imageMap.values())
          .sort((a, b) => b.topCaptionLikes - a.topCaptionLikes);

      totalUniqueImages = allImages.length;

      // Step 5: Paginate
      imagesWithCaptions = allImages.slice(offset, offset + ITEMS_PER_PAGE);

      // Step 6: Fetch user votes for visible captions
      if (user && imagesWithCaptions.length > 0) {
        const visibleCaptionIds = imagesWithCaptions.flatMap(img =>
            img.captions.map(c => c.id)
        );

        const { data: userCaptionVotes, error: votesError } = await supabase
            .from("caption_votes")
            .select("caption_id, vote_value")
            .eq("profile_id", user.id)
            .in("caption_id", visibleCaptionIds);

        if (votesError) {
          console.error("Error fetching user caption votes:", votesError);
        } else if (userCaptionVotes) {
          const userVotes: { [captionId: string]: VoteType } = {};
          userCaptionVotes.forEach((vote) => {
            if (vote.vote_value === 1) {
              userVotes[vote.caption_id] = VoteType.UPVOTE;
            } else if (vote.vote_value === -1) {
              userVotes[vote.caption_id] = VoteType.DOWNVOTE;
            }
          });

          imagesWithCaptions = imagesWithCaptions.map(image => ({
            ...image,
            captions: image.captions.map(caption => ({
              ...caption,
              user_vote: userVotes[caption.id] || VoteType.NONE,
            })),
          }));
        }
      }
    }
  } catch (error) {
    console.error("An unexpected error occurred:", error);
  }

  const totalPages = Math.ceil(totalUniqueImages / ITEMS_PER_PAGE);

  console.log("--- Pagination Debug Info ---");
  console.log("Total Unique Images (with likes):", totalUniqueImages);
  console.log("Items per page:", ITEMS_PER_PAGE);
  console.log("Total Pages:", totalPages);
  console.log("Current Page:", currentPage);
  console.log("Images on current page:", imagesWithCaptions.length);
  console.log("Captions per image:", imagesWithCaptions.map(img => img.captions.length));
  console.log("User authenticated:", !!user);
  console.log("----------------------------");

  return (
      <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black py-8">
        <main className="w-full max-w-5xl px-4">
          <h1 className="text-4xl font-bold text-center mb-10 text-black dark:text-white">
            Humor Project
          </h1>
          <p className="text-lg text-center text-gray-600 dark:text-gray-400 mb-10">
            Dive into the humorverse! Uncover the memes that make us chuckle, giggle, and guffaw.
          </p>
          <p className="text-md text-center text-gray-500 dark:text-gray-500 mb-10">
            Want to remember what truly tickles your funny bone?{' '}
            <Link
                href={user ? "/me" : "/auth"}
                className="text-blue-500 hover:underline"
            >
              See your personal humor collection!
            </Link>
          </p>

          {imagesWithCaptions.length === 0 ? (
              <p className="text-center text-xl text-gray-600 dark:text-gray-400">
                No images with liked captions found yet. Be the first to vote!
              </p>
          ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {imagesWithCaptions.map((imageWithCaps) => (
                      <div key={imageWithCaps.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
                        {imageWithCaps.url && (
                            <div className="relative h-48 mb-6 flex items-center justify-center">
                              <img
                                  src={imageWithCaps.url}
                                  alt={`Image ${imageWithCaps.id}`}
                                  style={{ objectFit: 'contain' }}
                                  className="rounded-md h-full object-contain max-w-full"
                              />
                            </div>
                        )}

                        <h3 className="text-xl font-medium mb-4 text-black dark:text-white">
                          Captions
                        </h3>
                        <div className="flex overflow-x-auto snap-x snap-mandatory pb-4 space-x-4 custom-scrollbar">
                          {imageWithCaps.captions.map((caption) => (
                              <CaptionCard key={caption.id} caption={caption} user={user} />
                          ))}
                        </div>
                      </div>
                  ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-4 mt-10">
                      <Link
                          href={{ pathname: "/", query: { page: currentPage - 1 } }}
                          aria-disabled={currentPage <= 1}
                          tabIndex={currentPage <= 1 ? -1 : undefined}
                          className={`px-4 py-2 rounded-md ${
                              currentPage <= 1
                                  ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                  : "bg-blue-500 hover:bg-blue-600 text-white"
                          }`}
                      >
                        Previous
                      </Link>
                      <span className="text-black dark:text-white">
                  Page {currentPage} of {totalPages}
                </span>
                      <Link
                          href={{ pathname: "/", query: { page: currentPage + 1 } }}
                          aria-disabled={currentPage >= totalPages}
                          tabIndex={currentPage >= totalPages ? -1 : undefined}
                          className={`px-4 py-2 rounded-md ${
                              currentPage >= totalPages
                                  ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                  : "bg-blue-500 hover:bg-blue-600 text-white"
                          }`}
                      >
                        Next
                      </Link>
                    </div>
                )}
              </>
          )}
        </main>
      </div>
  );
}