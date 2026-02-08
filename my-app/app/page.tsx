import { supabase } from "@/lib/supabaseClient";
import Link from "next/link"; // Import Link for navigation

interface Caption {
  id: string;
  content: string;
  like_count: number;
}

interface SupabaseImage {
  id: string;
  url: string;
  captions: Caption[]; // Supabase will return captions nested
}

interface ImageWithCaptions {
  id: string;
  url: string;
  captions: Caption[];
  maxLikeCount: number; // Add maxLikeCount to the interface
}

const ITEMS_PER_PAGE = 3; // Define how many images per page

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  let imagesWithCaptions: ImageWithCaptions[] = [];
  let allLikesAreZero = true; // Flag to check if all like_counts are zero

  // Pagination logic
  // Access searchParams directly after awaiting it
  const currentPage = Number((await searchParams).page) || 1;

  try {
    // Optimized single query to fetch images and their captions
    // We fetch all images first to determine totalPages accurately
    // and then apply pagination on the processed, sorted array.
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
      // Process raw data to calculate maxLikeCount and check allLikesAreZero
      imagesWithCaptions = rawImageData.map((img: SupabaseImage) => {
        const captions = img.captions || [];
        const maxLikeCount = captions.length > 0 ? Math.max(...captions.map(c => c.like_count)) : 0;

        if (maxLikeCount > 0) {
          allLikesAreZero = false;
        }

        // Sort captions by like_count for display within each image
        captions.sort((a, b) => b.like_count - a.like_count);

        return { ...img, captions, maxLikeCount };
      });

      // Sort images by maxLikeCount in descending order
      imagesWithCaptions.sort((a, b) => b.maxLikeCount - a.maxLikeCount);
    }
  } catch (error) {
    console.error("An unexpected error occurred:", error);
  }

  // Apply pagination after sorting
  const totalImages = imagesWithCaptions.length;
  const totalPages = Math.ceil(totalImages / ITEMS_PER_PAGE);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedImages = imagesWithCaptions.slice(offset, offset + ITEMS_PER_PAGE);

  // --- Server-side logging for debugging pagination ---
  console.log("--- Pagination Debug Info ---");
  console.log("Total Images:", totalImages);
  console.log("Items per page:", ITEMS_PER_PAGE);
  console.log("Total Pages:", totalPages);
  console.log("Current Page:", currentPage);
  console.log("Offset:", offset);
  console.log("Images on current page:", paginatedImages.length);
  console.log("----------------------------");
  // --- End Debug Info ---

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black py-8">
      <main className="w-full max-w-5xl px-4"> {/* Increased max-w for 3 columns */}
        <h1 className="text-4xl font-bold text-center mb-10 text-black dark:text-white">
          Humor Project
        </h1>

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
            {/* Grid for 3 images in one row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Adjusted grid classes */}
              {paginatedImages.map((imageWithCaps) => (
                <div key={imageWithCaps.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col"> {/* Added flex-col for consistent height */}
                  {imageWithCaps.url && (
                    // Use Next.js Image component for optimization, requires next.config.js remotePatterns setup
                    <div className="relative w-full h-48 mb-6"> {/* Fixed height container for image */}
                      <img
                        src={imageWithCaps.url}
                        alt={`Image ${imageWithCaps.id}`}
                        style={{ objectFit: 'cover' }} // cover the area
                        className="rounded-md w-full h-full" // Added w-full h-full to img to fill its parent div
                      />
                    </div>
                  )}

                  <h3 className="text-xl font-medium mb-4 text-black dark:text-white mt-auto"> {/* mt-auto to push to bottom */}
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

            {/* Pagination Controls */}
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
