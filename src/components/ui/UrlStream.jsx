import { useMemo } from 'react'

const FRAGMENTS = [
  'github.com/explore', 'stackoverflow.com/questions', 'youtube.com/watch',
  'docs.google.com/document', 'reddit.com/r/programming', 'twitter.com/home',
  'linkedin.com/feed', 'medium.com/@', 'figma.com/file/', 'notion.so/workspace',
  'aws.amazon.com/console', 'developer.mozilla.org/docs', 'npmjs.com/package/',
  'arxiv.org/abs/2', 'huggingface.co/models', 'news.ycombinator.com/item?id=',
  'kaggle.com/datasets', 'claude.ai/chat', 'netflix.com/browse', 'spotify.com/playlist',
  'vercel.app/dashboard', 'discord.com/channels', 'wikipedia.org/wiki/',
  'coursera.org/learn', 'github.com/trending', 'codesandbox.io/s/', 'chat.openai.com',
  'leetcode.com/problems', 'producthunt.com/posts', 'dribbble.com/shots',
]

export default function UrlStream() {
  const items = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      url: FRAGMENTS[i % FRAGMENTS.length],
      left: `${(i * 3.57 + (i % 3) * 8) % 98}%`,
      duration: 14 + (i * 3.1) % 20,
      delay: -((i * 5.7) % 24),
      opacity: 0.035 + (i % 6) * 0.01,
      size: 9 + (i % 4),
    }))
  , [])

  return (
    <div className="url-stream" aria-hidden="true">
      {items.map((item, i) => (
        <span
          key={i}
          className="url-fragment"
          style={{
            left: item.left,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
            opacity: item.opacity,
            fontSize: `${item.size}px`,
          }}
        >
          {item.url}
        </span>
      ))}
    </div>
  )
}
