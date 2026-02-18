import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-zinc-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button as="link" href="/" className="mt-6">
        Go home
      </Button>
      <Link
        href="/build"
        className="mt-3 text-sm text-zinc-500 hover:text-foreground"
      >
        Start a new build
      </Link>
    </div>
  );
}
