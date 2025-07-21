import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJiraStore } from '../store/useJiraStore';
import { toast } from 'sonner';

export const JiraConnectDialog = () => {
  const {
    email: storedEmail,
    apiToken: storedApiToken,
    domain: storedDomain,
    setEmail,
    setApiToken,
    setDomain,
  } = useJiraStore();

  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmailState] = useState(storedEmail || '');
  const [apiToken, setApiTokenState] = useState(storedApiToken || '');
  const [domain, setDomainState] = useState(storedDomain || '');

  const handleSave = () => {
    if (!email || !apiToken || !domain) {
      toast.error('Please fill in all Jira credentials.');
      return;
    }
    setEmail(email);
    setApiToken(apiToken);
    setDomain(domain);
    toast.success('Jira credentials saved!');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Connect to Jira</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect to Jira</DialogTitle>
          <DialogDescription>
            Enter your Jira credentials to fetch your assigned tasks. Your API token is stored locally and never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="domain" className="text-right">
              Domain
            </Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomainState(e.target.value)}
              placeholder="your-company.atlassian.net"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmailState(e.target.value)}
              placeholder="user@example.com"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-token" className="text-right">
              API Token
            </Label>
            <Input
              id="api-token"
              type="password"
              value={apiToken}
              onChange={(e) => setApiTokenState(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Credentials</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
