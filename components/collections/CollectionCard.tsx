"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  User,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    description?: string | null;
    clientName?: string | null;
    clientEmail?: string | null;
    listingCount: number;
    previewPhotos: { id?: string; url: string }[];
    createdAt: string;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEmail?: (id: string) => void;
}

export function CollectionCard({
  collection,
  onEdit,
  onDelete,
  onEmail,
}: CollectionCardProps) {
  // FIX: API returns previewPhotos, not listings with nested photos
  const photos = (collection.previewPhotos || []).slice(0, 4).map((p) => p.url);

  return (
    <Link href={`/collections/${collection.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg group p-0 gap-0">
        {/* Photo Grid */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {photos.length > 0 ? (
            <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
              {photos.map((url, i) => (
                <div key={i} className="relative overflow-hidden">
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                </div>
              ))}
              {photos.length < 4 &&
                Array.from({ length: 4 - photos.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="bg-muted flex items-center justify-center"
                  >
                    <FolderOpen className="size-5 text-muted-foreground/30" />
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FolderOpen className="size-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Actions dropdown */}
          <div
            className="absolute right-2 top-2 z-10"
            onClick={(e) => e.preventDefault()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 bg-white/90 backdrop-blur-sm shadow-sm"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(collection.id)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onEmail && collection.clientEmail && (
                  <DropdownMenuItem onClick={() => onEmail(collection.id)}>
                    <Mail className="size-3.5" />
                    Email to Client
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(collection.id)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
              {collection.name}
            </h3>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {collection.listingCount} listing
              {collection.listingCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          {collection.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {collection.description}
            </p>
          )}

          {collection.clientName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="size-3" />
              <span>For: {collection.clientName}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
