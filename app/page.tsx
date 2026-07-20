import Landing from "@/components/v2/Landing";

type HomeProps = {
  searchParams: Promise<{ experience?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { experience } = await searchParams;
  return <Landing variant={experience === "b" ? "b" : "a"} />;
}
