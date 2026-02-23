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
      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Main Content (Center) */}
      <div className="col-start-2 space-y-6 relative">
        <CreatePost />
        <div className="flex flex-col space-y-6 items-center">
          {posts.length === 0 ? (
            <div className="text-center text-gray-400">No posts yet</div>
          ) : (
            posts.map((post: PostType) => <Post key={post.id} post={post} />)
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <RightSidebar />
    </HomeLayout>
  );
};
