import { createClient } from '@/utils/supabase/server'
import Link from "next/link";

interface Caption {
  id: string;
  content: string;
  like_count: number;
}

interface SupabaseImage {
  id: string;
  url: string;
  captions: Caption[];
}

interface ImageWithCaptions {
  id: string;
  url: string;
  captions: Caption[];
  maxLikeCount: number;
}

const ITEMS_PER_PAGE = 3;

export default async function Home({
                                     searchParams,
                                   }: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Get the authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let imagesWithCaptions: ImageWithCaptions[] = [];
  let allLikesAreZero = true;

  const currentPage = Number((await searchParams).page) || 1;

  try {
    const { data: rawImageData, error: imageError } = await supabase
        .from("images")
        .select(`
        id,
        url,
        captions(
          id,
          content,
          like_count
        )
      `);

    if (imageError) {
      console.error("Error fetching images and captions:", imageError);
    } else if (rawImageData && rawImageData.length > 0) {
      imagesWithCaptions = rawImageData.map((img: SupabaseImage) => {
        const captions = img.captions || [];
        const maxLikeCount = captions.length > 0 ? Math.max(...captions.map(c => c.like_count)) : 0;

        if (maxLikeCount > 0) {
          allLikesAreZero = false;
        }

        captions.sort((a, b) => b.like_count - a.like_count);

        return { ...img, captions, maxLikeCount };
      });

      imagesWithCaptions.sort((a, b) => b.maxLikeCount - a.maxLikeCount);
    }
  } catch (error) {
    console.error("An unexpected error occurred:", error);
  }

  const totalImages = imagesWithCaptions.length;
  const totalPages = Math.ceil(totalImages / ITEMS_PER_PAGE);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedImages = imagesWithCaptions.slice(offset, offset + ITEMS_PER_PAGE);

  console.log("--- Pagination Debug Info ---");
  console.log("Total Images:", totalImages);
  console.log("Items per page:", ITEMS_PER_PAGE);
  console.log("Total Pages:", totalPages);
  console.log("Current Page:", currentPage);
  console.log("Offset:", offset);
  console.log("Images on current page:", paginatedImages.length);
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

          {allLikesAreZero && (
              <p className="text-center text-red-500 mb-6">
                Note: All captions currently have 0 likes. Images are displayed in their original order.
              </p>
          )}

          {imagesWithCaptions.length === 0 ? (
              <p className="text-center text-xl text-gray-600 dark:text-gray-400">
                No images found. Please ensure your Supabase database is populated.
              </p>
          ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedImages.map((imageWithCaps) => (
                      <div key={imageWithCaps.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
                        {imageWithCaps.url && (
                            <div className="relative w-full h-48 mb-6">
                              <img
                                  src={imageWithCaps.url}
                                  alt={`Image ${imageWithCaps.id}`}
                                  style={{ objectFit: 'cover' }}
                                  className="rounded-md w-full h-full"
                              />
                            </div>
                        )}

                        <h3 className="text-xl font-medium mb-4 text-black dark:text-white">
                          Captions:
                        </h3>
                        {imageWithCaps.captions.length > 0 ? (
                            <div className="flex overflow-x-auto snap-x snap-mandatory pb-4 space-x-4 custom-scrollbar">
                              {imageWithCaps.captions.map((caption) => (
                                  <div
                                      key={caption.id}
                                      className="flex-none w-64 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow snap-center"
                                  >
                                    <p className="text-gray-800 dark:text-gray-200 text-base mb-2">
                                      {caption.content}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Likes: {caption.like_count}
                                    </p>
                                  </div>
                              ))}
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400">
                              No captions available for this image.
                            </p>
                        )}
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