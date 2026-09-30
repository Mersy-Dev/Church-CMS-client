import { useParams } from 'react-router-dom';

export default function BlogPostPage() {
  const { slug } = useParams();
  // TODO: build the blog post detail page using slug.
  return <div>TODO: BlogPostPage - {slug}</div>;
}
