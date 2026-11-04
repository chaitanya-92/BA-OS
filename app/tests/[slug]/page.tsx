import { TestRunner } from "@/components/tests/test-runner";

export default async function TestAttemptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TestRunner slug={slug} />;
}
