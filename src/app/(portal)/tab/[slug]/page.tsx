export default async function TabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <div>Tab: {slug}</div>;
}
