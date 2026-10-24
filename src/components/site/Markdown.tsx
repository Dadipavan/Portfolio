import type { ReactNode } from 'react';
import { mediaUrl } from '@/lib/media';
import { parseMarkdown, type Block, type Inline } from '@/lib/markdown';
import type { MediaFile } from '@/lib/types';

interface MarkdownProps {
  source: string;
  // pictures the text can refer to with ![caption](media:<id>)
  media?: MediaFile[];
  // "# Heading" becomes <h3> by default, so the text fits under the h2 of its section or window
  headingOffset?: number;
  className?: string;
}

function Inlines({ nodes, media }: { nodes: Inline[]; media: MediaFile[] }): ReactNode {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'text':
        return node.text;
      case 'br':
        return <br key={index} />;
      case 'code':
        return (
          <code key={index} className="md-code">
            {node.text}
          </code>
        );
      case 'strong':
        return (
          <strong key={index}>
            <Inlines nodes={node.children} media={media} />
          </strong>
        );
      case 'em':
        return (
          <em key={index}>
            <Inlines nodes={node.children} media={media} />
          </em>
        );
      case 'link': {
        const external = node.href.startsWith('http');
        return (
          <a
            key={index}
            href={node.href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            <Inlines nodes={node.children} media={media} />
          </a>
        );
      }
      case 'image': {
        if (node.src.startsWith('media:')) {
          const file = media.find((m) => m.id === node.src.slice(6));
          if (!file) return null;
          const caption = node.alt || file.caption;
          return (
            <span key={index} className="md-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(file.path)}
                alt={node.alt || file.alt || file.caption || ''}
                width={file.width}
                height={file.height}
                loading="lazy"
                decoding="async"
              />
              {caption && <span className="md-caption">{caption}</span>}
            </span>
          );
        }
        return (
          <span key={index} className="md-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={node.src}
              alt={node.alt}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            {node.alt && <span className="md-caption">{node.alt}</span>}
          </span>
        );
      }
    }
  });
}

function Blocks({
  blocks,
  media,
  offset,
}: {
  blocks: Block[];
  media: MediaFile[];
  offset: number;
}): ReactNode {
  return blocks.map((block, index) => {
    switch (block.type) {
      case 'heading': {
        const Tag = `h${Math.min(6, block.level + offset)}` as 'h3';
        return (
          <Tag key={index}>
            <Inlines nodes={block.children} media={media} />
          </Tag>
        );
      }
      case 'paragraph':
        return (
          <p key={index}>
            <Inlines nodes={block.children} media={media} />
          </p>
        );
      case 'rule':
        return <hr key={index} />;
      case 'quote':
        return (
          <blockquote key={index}>
            <Blocks blocks={block.children} media={media} offset={offset} />
          </blockquote>
        );
      case 'code':
        return (
          <pre
            key={index}
            tabIndex={0}
            className="md-pre"
            aria-label={block.lang ? `Code (${block.lang})` : 'Code'}
          >
            <code>{block.text}</code>
          </pre>
        );
      case 'list': {
        const List = block.ordered ? 'ol' : 'ul';
        return (
          <List key={index}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Inlines nodes={item.children} media={media} />
                {item.sublist && <Blocks blocks={[item.sublist]} media={media} offset={offset} />}
              </li>
            ))}
          </List>
        );
      }
    }
  });
}

// Shows text written in Markdown (see src/lib/markdown.ts for what it understands). Never renders raw HTML.
export default function Markdown({
  source,
  media = [],
  headingOffset = 2,
  className = '',
}: MarkdownProps) {
  const blocks = parseMarkdown(source);
  if (blocks.length === 0) return null;
  return (
    <div className={`md ${className}`}>
      <Blocks blocks={blocks} media={media} offset={headingOffset} />
    </div>
  );
}
