import App from './app';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const p = await searchParams;
  return <App email={p.email ?? ''} />;
}
