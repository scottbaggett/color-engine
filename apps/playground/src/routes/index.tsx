import { createFileRoute } from "@tanstack/react-router";
import GenerativeColorPlayground from "@/components/playground";

export const Route = createFileRoute("/")({
  component: GenerativeColorPlayground,
});
