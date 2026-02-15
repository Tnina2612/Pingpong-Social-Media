import { HomeLayout } from "@/components/homepage";
import { Post, type PostData } from "@/components/homepage/post";
import { useGetAllPosts } from "@/services/homepage/post";

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
          posts.map((post: PostData) => <Post key={post.id} post={post} />)
        )}
      </div>
    </HomeLayout>
  );
};
