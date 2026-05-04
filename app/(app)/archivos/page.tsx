import { redirect } from "next/navigation";

export const metadata = {
  title: "Archivos y Enlaces · GNERAI",
};

type SearchParams = {
  q?: string;
  tag?: string;
  sort?: "recent" | "name";
};

export default async function ArchivosPage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await _searchParams;
  redirect("/wiki");
}
