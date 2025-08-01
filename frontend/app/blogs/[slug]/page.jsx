import blogEntries from "../../../data/blogs";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return blogEntries.map((entry) => ({
    slug: entry.slug,
  }));
}

export default function BlogPostPage({ params }) {
  const { slug } = params;
  const post = blogEntries.find((entry) => entry.slug === slug);

  if (!post) return notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-white">
      <h1 className="text-4xl font-bold mb-6">{post.title}</h1>
      <div className="text-lg text-gray-300 whitespace-pre-line">
        {post.content}
      </div>
    </div>
  );
}
