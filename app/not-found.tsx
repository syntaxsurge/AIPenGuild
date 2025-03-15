import NotFoundPage from './errors/404/page';

/**
 * Next.js will automatically use this component
 * whenever something is not found (via throwing notFound() or
 * visiting a route that doesn't exist).
 */
export default function NotFound() {
  return <NotFoundPage />;
}