import {
  HomeLayout,
  LeftSidebar,
  Post,
  RightSidebar,
} from "@/components/homepage";
import { CreatePost } from "@/components/homepage/create-post";
import { useGetAllPosts } from "@/services/homepage/post";
import type { PostType } from "@/types";

export const HomePage = () => {
  const { data: posts = [], isLoading, error } = useGetAllPosts();

  if (isLoading) {
    return (
      <HomeLayout>
        <div className="text-center text-gray-400">Loading posts...</div>
      </HomeLayout>
    );
  }

  if (error) {
    return (
      <HomeLayout>
        <div className="text-center text-red-400">Error loading posts</div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      {/* Left Sidebar - Hidden on mobile/tablet, visible on desktop (lg+) */}
      <div className="hidden lg:block">
        <LeftSidebar />
      </div>

      {/* Main Content (Center) - Always visible */}
      <div className="space-y-6 relative px-4 lg:px-0">
        <CreatePost />
        <div className="flex flex-col space-y-6 items-center">
          {posts.length === 0 ? (
            <div className="text-center text-gray-400">No posts yet</div>
          ) : (
            posts.map((post: PostType) => <Post key={post.id} post={post} />)
          )}
        </div>
      </div>

      {/* Right Sidebar - Hidden on mobile, visible on tablet+ (md+) */}
      <div className="hidden md:block">
        <RightSidebar />
      </div>
    </HomeLayout>
  );
};
