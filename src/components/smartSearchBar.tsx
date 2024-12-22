import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function SmartSearchBar() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      navigate({ to: `/at/${input}` });
      // Or if you have a route defined with params:
      // navigate({ to: '/at/$id', params: { id: input } });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search..."
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        className="pl-8"
      />
      <ArrowRight
        className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        onClick={handleSubmit}
      />
    </form>
  );
}
