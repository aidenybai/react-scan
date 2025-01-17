import { describe, it, expect } from 'vitest';
import { transform } from './utils';

describe('modern React patterns', () => {
  it('handles components with hooks and context', async () => {
    const input = `
      const UserProfile = () => {
        const { user } = useContext(UserContext)
        const { theme } = useContext(ThemeContext)
        return (
          <div className={theme}>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
        )
      }
    `;
    const result = await transform(input);
    expect(result).toContain("UserProfile.displayName = 'UserProfile'");
  });

  it('handles components with custom hooks', async () => {
    const input = `
      const SearchResults = () => {
        const { data, loading, error } = useQuery(SEARCH_QUERY)
        const { formatResult } = useSearchFormatter()

        if (loading) return <div>Loading...</div>
        if (error) return <div>Error!</div>

        return (
          <ul>
            {data.map(item => (
              <li key={item.id}>{formatResult(item)}</li>
            ))}
          </ul>
        )
      }
    `;
    const result = await transform(input);
    expect(result).toContain("SearchResults.displayName = 'SearchResults'");
  });

  it('handles components with suspense boundaries', async () => {
    const input = `
      const AsyncContent = () => {
        const data = useSuspenseQuery(QUERY)
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <div>{data.content}</div>
          </Suspense>
        )
      }
    `;
    const result = await transform(input);
    expect(result).toContain("AsyncContent.displayName = 'AsyncContent'");
  });

  it('handles components with error boundaries', async () => {
    const input = `
      import React from 'react';

      class ErrorBoundary extends React.Component {
        state = { hasError: false }

        static getDerivedStateFromError(error) {
          return { hasError: true }
        }

        render() {
          if (this.state.hasError) {
            return <div>Something went wrong</div>
          }
          return this.props.children
        }
      }
    `;
    const result = await transform(input);
    expect(result).toContain("ErrorBoundary.displayName = 'ErrorBoundary'");
  });
});
