"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Send,
  Paperclip,
  X,
} from "lucide-react";

// Mock contacts for recipient search
const mockContacts = [
  { id: "1", name: "Sarah Chen", email: "sarah.chen@example.com", role: "Investor", company: "Johnson Family Office" },
  { id: "2", name: "Michael Roberts", email: "m.roberts@alphafund.com", role: "Fund Manager", company: "Alpha Capital" },
  { id: "3", name: "Jennifer Walsh", email: "j.walsh@compliance.com", role: "Compliance Officer", company: "Compliance Solutions" },
  { id: "4", name: "David Kim", email: "d.kim@citco.com", role: "Account Manager", company: "Citco Fund Services" },
  { id: "5", name: "Emily Thompson", email: "e.thompson@summit.com", role: "Event Coordinator", company: "Global Summit Events" },
  { id: "6", name: "James Wilson", email: "j.wilson@hedge.com", role: "Portfolio Manager", company: "Wellington Capital" },
  { id: "7", name: "Lisa Martinez", email: "l.martinez@pwc.com", role: "Audit Partner", company: "PwC" },
  { id: "8", name: "Robert Taylor", email: "r.taylor@goldmansachs.com", role: "Prime Services", company: "Goldman Sachs" },
];

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    recipient: { id: string; name: string; email: string };
    subject: string;
  };
}

export function ComposeModal({ open, onOpenChange, replyTo }: ComposeModalProps) {
  const [recipients, setRecipients] = useState<typeof mockContacts>([]);
  const [subject, setSubject] = useState(replyTo?.subject ? `Re: ${replyTo.subject}` : "");
  const [body, setBody] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const filteredContacts = mockContacts.filter(
    contact =>
      !recipients.find(r => r.id === contact.id) &&
      (contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddRecipient = (contact: typeof mockContacts[0]) => {
    setRecipients([...recipients, contact]);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const handleRemoveRecipient = (contactId: string) => {
    setRecipients(recipients.filter(r => r.id !== contactId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (recipients.length === 0 || !subject.trim() || !body.trim()) {
      return;
    }
    
    // In production, this would send the message via API
    console.log("Sending message:", {
      recipients,
      subject,
      body,
      attachments,
    });
    
    // Reset form and close
    setRecipients([]);
    setSubject("");
    setBody("");
    setAttachments([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    // Reset form state when closing
    setRecipients([]);
    setSubject("");
    setBody("");
    setAttachments([]);
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Compose and send a message to other HedgeCo.Net members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients */}
          <div className="space-y-2">
            <Label>To</Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] bg-white">
              {recipients.map(recipient => (
                <Badge 
                  key={recipient.id} 
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  {recipient.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(recipient.id)}
                    className="ml-1 rounded-full p-0.5 hover:bg-slate-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex-1 min-w-[150px] text-left text-sm text-slate-500 hover:text-slate-700 outline-none"
                  >
                    {recipients.length === 0 ? "Search contacts..." : "Add more..."}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search by name, email, or company..." 
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No contacts found.</CommandEmpty>
                      <CommandGroup heading="Contacts">
                        <ScrollArea className="h-[200px]">
                          {filteredContacts.map(contact => (
                            <CommandItem
                              key={contact.id}
                              value={contact.name}
                              onSelect={() => handleAddRecipient(contact)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs bg-slate-200 text-slate-600">
                                    {getInitials(contact.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">{contact.name}</div>
                                  <div className="text-xs text-slate-500 truncate">
                                    {contact.email} • {contact.company}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {contact.role}
                                </Badge>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter message subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[200px] resize-none"
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-md"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Paperclip className="h-4 w-4 text-slate-400" />
                      <span className="truncate max-w-[300px]">{file.name}</span>
                      <span className="text-xs text-slate-400">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <X className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <input
                type="file"
                id="file-upload"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Attach Files
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSend}
                disabled={recipients.length === 0 || !subject.trim() || !body.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
