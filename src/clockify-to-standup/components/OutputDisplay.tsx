import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface OutputDisplayProps {
  output: string;
  setOutput: (output: string) => void;
}

export const OutputDisplay = ({ output, setOutput }: OutputDisplayProps) => {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setHasCopied(true);
    toast.success("Standup copied to clipboard!");
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <section className="relative p-6 border rounded-lg bg-card text-card-foreground mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">3. Your Standup</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopy}
          aria-label="Copy to clipboard"
        >
          {hasCopied ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </Button>
      </div>
      <Textarea
        value={output}
        onChange={(e) => setOutput(e.target.value)}
        className="p-4 bg-muted rounded-md overflow-x-auto whitespace-pre-wrap break-words text-sm min-h-[300px] font-mono"
        aria-label="Standup output"
        placeholder="Your generated standup will appear here..."
      />
    </section>
  );
};
