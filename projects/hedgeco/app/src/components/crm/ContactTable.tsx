"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Mail,
  Phone,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  role: string;
  stage: "lead" | "prospect" | "qualified" | "negotiation" | "closed" | "lost";
  lastContact?: Date;
  value?: number;
  tags?: string[];
}

interface ContactTableProps {
  contacts: Contact[];
  onContactClick?: (contact: Contact) => void;
  onContactEdit?: (contact: Contact) => void;
  onContactDelete?: (contactId: string) => void;
  className?: string;
}

const stageConfig = {
  lead: { label: "Lead", color: "bg-slate-100 text-slate-700" },
  prospect: { label: "Prospect", color: "bg-blue-100 text-blue-700" },
  qualified: { label: "Qualified", color: "bg-amber-100 text-amber-700" },
  negotiation: { label: "Negotiation", color: "bg-purple-100 text-purple-700" },
  closed: { label: "Closed Won", color: "bg-emerald-100 text-emerald-700" },
  lost: { label: "Lost", color: "bg-red-100 text-red-700" },
};

type SortField = "name" | "company" | "stage" | "value" | "lastContact";
type SortDirection = "asc" | "desc";

export function ContactTable({
  contacts,
  onContactClick,
  onContactEdit,
  onContactDelete,
  className,
}: ContactTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    
    switch (sortField) {
      case "name":
        return a.name.localeCompare(b.name) * multiplier;
      case "company":
        return a.company.localeCompare(b.company) * multiplier;
      case "stage":
        return a.stage.localeCompare(b.stage) * multiplier;
      case "value":
        return ((a.value || 0) - (b.value || 0)) * multiplier;
      case "lastContact":
        const dateA = a.lastContact?.getTime() || 0;
        const dateB = b.lastContact?.getTime() || 0;
        return (dateA - dateB) * multiplier;
      default:
        return 0;
    }
  });

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedContacts.map(c => c.id)));
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedIds.size > 0 && (
          <span className="text-sm text-slate-500">
            {selectedIds.size} selected
          </span>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === sortedContacts.length && sortedContacts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort("name")}
                >
                  Contact
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort("company")}
                >
                  Company
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort("stage")}
                >
                  Stage
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort("value")}
                >
                  Value
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              sortedContacts.map((contact) => {
                const stage = stageConfig[contact.stage];
                return (
                  <TableRow
                    key={contact.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => onContactClick?.(contact)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(contact.id)}
                        onCheckedChange={() => toggleSelect(contact.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-sm">
                            {contact.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">{contact.name}</p>
                          <p className="text-sm text-slate-500">{contact.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{contact.company}</p>
                        <p className="text-sm text-slate-500">{contact.role}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium", stage.color)}>
                        {stage.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.value ? (
                        <span className="font-medium">
                          ${contact.value.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onContactClick?.(contact)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onContactEdit?.(contact)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </DropdownMenuItem>
                          {contact.phone && (
                            <DropdownMenuItem>
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onContactDelete?.(contact.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default ContactTable;
