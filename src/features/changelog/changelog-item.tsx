import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import { formatDate } from "@/lib/format/date";
import Image from "next/image";
import type { Changelog } from "./changelog-manager";

type ChangelogItemProps = {
  changelog: Changelog;
  showImage?: boolean;
};

const getExcerpt = (content: string, maxLength = 120): string => {
  const firstParagraph = content
    .split("\n")
    .find(
      (line) => line.trim() && !line.startsWith("#") && !line.startsWith("-"),
    );

  if (!firstParagraph) {
    return "";
  }

  const cleaned = firstParagraph.trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.substring(0, maxLength).trim()}...`;
};

export function ChangelogItem({
  changelog,
  showImage = true,
}: ChangelogItemProps) {
  const { attributes } = changelog;
  const excerpt = getExcerpt(changelog.content);

  return (
    <Item variant="outline" className="flex-col items-start">
      {showImage && attributes.image && (
        <ItemHeader>
          <Image
            src={attributes.image}
            alt={attributes.title ?? "Changelog"}
            width={400}
            height={200}
            className="aspect-video w-full rounded-sm object-cover"
          />
        </ItemHeader>
      )}
      <ItemContent>
        <ItemTitle>
          <span>{attributes.title ?? "New Update"}</span>
        </ItemTitle>
        <p className="text-muted-foreground text-xs">
          {formatDate(attributes.date)}
        </p>
        {excerpt && <ItemDescription>{excerpt}</ItemDescription>}
      </ItemContent>
    </Item>
  );
}
