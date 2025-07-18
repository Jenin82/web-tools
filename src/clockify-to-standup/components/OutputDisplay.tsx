import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type OutputDisplayProps = {
  output: string;
  onCopy: () => void;
};

export const OutputDisplay = ({ output, onCopy }: OutputDisplayProps) => {
  const handleCopy = () => {
    onCopy();
    toast.success('Standup summary copied to clipboard!');
  };

  if (!output) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Standup Summary</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCopy}
            className="h-8"
          >
            Copy to Clipboard
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-md">
          {output}
        </pre>
      </CardContent>
    </Card>
  );
};
