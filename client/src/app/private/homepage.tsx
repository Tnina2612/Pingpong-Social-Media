import {
  LeftSidebar,
  Post,
  RightSidebar,
  SubLayout,
} from "@/components/homepage";
import { CreatePost } from "@/components/homepage/create-post";
import { useGetAllPosts } from "@/services/homepage/post";
import type { PostType } from "@/types";

export const HomePage = () => {
  const { data: posts = [], isLoading, error } = useGetAllPosts();

  return (
    <SubLayout>
      {/* Left Sidebar */}
      <div className="hidden lg:block">
        <LeftSidebar />
      </div>

      {/* Main Content */}
      <div className="space-y-6 relative px-4 lg:px-0">
        <CreatePost />

        <div className="flex flex-col space-y-6 items-center">
          {isLoading && (
            <div className="text-center text-gray-400">Loading posts...</div>
          )}

          {error && (
            <div className="text-center text-red-400">Error loading posts</div>
          )}

          {!isLoading && !error && posts.length === 0 && (
            <div className="text-center text-gray-400">No posts yet</div>
          )}

          {!isLoading &&
            !error &&
            posts.map((post: PostType) => <Post key={post.id} post={post} />)}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden md:block">
        <RightSidebar />
      </div>
    </SubLayout>
  );
};
