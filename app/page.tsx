import Landing from "@/components/v2/Landing";
import Story from "@/components/v2/Story";

type HomeProps = {
  searchParams: Promise<{ experience?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { experience } = await searchParams;
  // Story is a server component passed through the client Landing as a prop,
  // so its static sections render on the server and ship no JS.
  return <Landing variant={experience === "b" ? "b" : "a"} story={<Story />} />;
}
