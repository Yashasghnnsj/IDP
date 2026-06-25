import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isChat?: boolean;
}

export function MarkdownRenderer({ content, className = '', isChat = false }: MarkdownRendererProps) {
  const parseInline = (text: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const segments = text.split(tokenRegex);

    segments.forEach((seg, idx) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        const innerText = seg.slice(2, -2);
        tokens.push(
          <strong key={idx} className={`font-bold ${isChat ? 'text-blue-800' : 'text-blue-700'}`}>
            {innerText}
          </strong>
        );
      } else if (seg.startsWith('*') && seg.endsWith('*')) {
        tokens.push(
          <em key={idx} className="italic text-gray-500">
            {seg.slice(1, -1)}
          </em>
        );
      } else if (seg.startsWith('`') && seg.endsWith('`')) {
        tokens.push(
          <code key={idx} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-xs text-red-600">
            {seg.slice(1, -1)}
          </code>
        );
      } else {
        tokens.push(seg);
      }
    });

    return tokens;
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentList: React.ReactNode[] = [];
  let listKey = 0;
  let prevWasHeading = false;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul
          key={`list-${listKey++}`}
          className={`list-disc pl-5 my-3 space-y-1.5 text-gray-700`}
        >
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      flushList();
      prevWasHeading = true;
      elements.push(
        <h3 key={i} className="text-base font-extrabold text-gray-900 mt-5 mb-3 border-l-4 border-blue-500 pl-3 leading-relaxed">
          {parseInline(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      prevWasHeading = true;
      elements.push(
        <h2 key={i} className="text-lg font-extrabold text-gray-950 mt-6 mb-3 border-b border-gray-200 pb-2 leading-relaxed">
          {parseInline(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      prevWasHeading = true;
      elements.push(
        <h1 key={i} className="text-xl font-extrabold text-gray-950 mt-6 mb-4 leading-relaxed">
          {parseInline(trimmed.substring(2))}
        </h1>
      );
    } else if (line.startsWith('  * ') || line.startsWith('  - ') || line.startsWith('\t* ') || line.startsWith('\t- ')) {
      const itemContent = trimmed.substring(2);
      currentList.push(
        <li key={`sub-${currentList.length}`} className="ml-5 list-[circle] leading-relaxed text-sm text-gray-500">
          {parseInline(itemContent)}
        </li>
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const itemContent = trimmed.substring(2);
      currentList.push(
        <li key={currentList.length} className="leading-relaxed text-gray-700">
          {parseInline(itemContent)}
        </li>
      );
    } else {
      if (trimmed === '') {
        flushList();
        elements.push(<div key={i} className="h-2" />);
        prevWasHeading = false;
      } else {
        flushList();

        if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.includes('**')) {
          elements.push(
            <div key={i} className="mt-4 p-3 bg-amber-50/70 border border-amber-200/50 rounded-lg">
              <p className="text-xs text-amber-800 leading-relaxed flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{parseInline(trimmed.slice(1, -1))}</span>
              </p>
            </div>
          );
        } else {
          const isKeyFinding = prevWasHeading && trimmed.length > 20;
          elements.push(
            <p key={i} className={`leading-relaxed mb-2 ${
              isChat ? 'text-gray-700 text-sm' : 'text-gray-700 text-sm'
            } ${isKeyFinding && !isChat ? 'bg-blue-50/50 border-l-2 border-blue-300 pl-3 py-2 rounded-r-md' : ''}`}>
              {parseInline(line)}
            </p>
          );
        }
        prevWasHeading = false;
      }
    }
  }
  flushList();

  return <div className={`markdown-body ${className}`}>{elements}</div>;
}
