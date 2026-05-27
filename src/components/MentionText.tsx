import type { ReactNode } from 'react';
import { UserLink } from '@/components/UserLink';

// Miroir du regex backend (mentions.service.ts) : @username, chars [a-z0-9_.-],
// 3-32 caractères, avec une frontière avant le @ pour ne pas matcher les emails.
const MENTION_REGEX = /(^|[^a-z0-9_.-])@([a-z0-9_.-]{3,32})/gi;

// Rend un texte libre en surlignant les @mentions et en les rendant cliquables
// (vers le profil public /u/:username). Le reste du texte est rendu tel quel.
export function MentionText({ text, className }: { text: string; className?: string }) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(MENTION_REGEX)) {
    const full = match[0];
    const boundary = match[1] ?? '';
    const username = match[2];
    const start = match.index ?? 0;

    // Texte avant la mention
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    // La frontière (espace, ponctuation...) reste du texte normal
    if (boundary) parts.push(boundary);
    // Le @username devient un lien stylé
    parts.push(
      <UserLink key={key++} username={username} className="font-medium text-primary hover:underline">
        @{username}
      </UserLink>,
    );

    lastIndex = start + full.length;
  }

  // Reste du texte après la dernière mention
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <span className={className}>{parts}</span>;
}
