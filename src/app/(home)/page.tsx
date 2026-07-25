import Link from 'next/link';

const KNOWN_AUTHORS = ['dealenx'];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">razdfeed</h1>
      <p className="text-fd-muted-foreground mb-8">
        Агрегатор блогов на GitHub Discussions
      </p>

      <section>
        <h2 className="text-lg font-semibold mb-4">Авторы</h2>
        <ul className="space-y-2">
          {KNOWN_AUTHORS.map((author) => (
            <li key={author}>
              <Link
                href={`/${author}`}
                className="text-fd-primary hover:underline"
              >
                @{author}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}