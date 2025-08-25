'use client';

import { useState, useEffect } from 'react';
import { codeToHtml } from 'shiki';

interface CodeHighlighterProps {
  code: string;
  language: string;
  theme?: string;
  className?: string;
}

export const CodeHighlighter = ({ code, language, theme = 'github-dark', className = '' }: CodeHighlighterProps) => {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const highlightCode = async () => {
      try {
        const highlighted = await codeToHtml(code, {
          lang: language,
          theme: theme,
        });

        setHtml(highlighted);
      } catch {
        setHtml(`<pre><code>${code}</code></pre>`);
      } finally {
        setLoading(false);
      }
    };

    highlightCode();
  }, [code, language, theme]);

  if (loading) {
    return (
      <div className={`bg-foreground/5 p-4 rounded-lg ${className}`}>
        <pre className='text-sm opacity-50'>Loading...</pre>
      </div>
    );
  }

  return (
    <div
      className={`overflow-auto rounded-lg text-sm [&_pre]:!bg-transparent [&_pre]:!p-4 [&_pre]:!m-0 [&_code]:!bg-transparent ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
