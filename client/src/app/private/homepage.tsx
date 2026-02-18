import { HomeLayout, Post } from "@/components/homepage";
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
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center text-gray-400">No posts yet</div>
        ) : (
          posts.map((post: PostType) => <Post key={post.id} post={post} />)
        )}
      </div>
    </HomeLayout>
  );
};
