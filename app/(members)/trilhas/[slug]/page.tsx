export default async function TrilhaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <main>Trilha: {slug}</main>;
}
