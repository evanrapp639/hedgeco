"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FundData {
  id: string;
  name: string;
  type: string;
  views: number;
  viewsChange: number;
  uniqueVisitors: number;
  avgTimeOnPage: string;
}

interface TopFundsTableProps {
  data: FundData[];
  className?: string;
  title?: string;
  loading?: boolean;
}

type SortField = "views" | "uniqueVisitors" | "viewsChange";
type SortDirection = "asc" | "desc";

export function TopFundsTable({
  data,
  className,
  title = "Top Performing Funds",
  loading = false,
}: TopFundsTableProps) {
  const [sortField, setSortField] = useState<SortField>("views");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    return (a[sortField] - b[sortField]) * multiplier;
  });

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse h-12 bg-slate-100 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-slate-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Fund Name</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("views")}
                >
                  Views
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("viewsChange")}
                >
                  Change
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("uniqueVisitors")}
                >
                  Visitors
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Avg Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((fund) => (
              <TableRow key={fund.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{fund.name}</span>
                    <Badge variant="outline" className="w-fit mt-1 text-xs">
                      {fund.type}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {fund.views.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    fund.viewsChange > 0 ? "text-emerald-600" : fund.viewsChange < 0 ? "text-red-600" : "text-slate-500"
                  )}>
                    {fund.viewsChange > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : fund.viewsChange < 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : null}
                    {fund.viewsChange > 0 ? "+" : ""}{fund.viewsChange}%
                  </div>
                </TableCell>
                <TableCell>{fund.uniqueVisitors.toLocaleString()}</TableCell>
                <TableCell className="text-right text-slate-500">
                  {fund.avgTimeOnPage}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default TopFundsTable;
