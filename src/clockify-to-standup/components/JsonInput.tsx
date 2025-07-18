import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type JsonInputProps = {
  value: string;
  onChange: (value: string) => void;
  onProcess: () => void;
  isProcessing: boolean;
  error?: string;
};

export const JsonInput = ({
  value,
  onChange,
  onProcess,
  isProcessing,
  error,
}: JsonInputProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="clockify-json" className="block text-sm font-medium mb-1">
          Clockify JSON <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="clockify-json"
          placeholder="Paste your Clockify time entries JSON here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[200px] font-mono text-sm resize-none overflow-auto"
        />
      </div>
      
      {error && (
        <div className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="font-medium mb-1">Error processing data</div>
          <div className="font-mono text-xs bg-white p-2 rounded border border-red-100 mt-1">
            {error}
          </div>
          <div className="mt-2 text-xs text-red-500">
            Tip: Make sure your JSON is properly formatted and includes a 'timeEntriesList' array.
          </div>
        </div>
      )}
      
      <Button 
        onClick={onProcess}
        disabled={!value.trim() || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : 'Generate Standup'}
      </Button>
    </div>
  );
};
