import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  const navigate = useNavigate();
  return (
    <div className="h-screen flex flex-row gap-4 items-center justify-center content-center">
      <Button variant="outline" size="lg" onClick={() => navigate({ to: "/" })}>
        Home
      </Button>
      <Button
        disabled
        variant="default"
        size="lg"
        onClick={() => navigate({ to: "/about" })}
      >
        About
      </Button>
    </div>
  );
}
