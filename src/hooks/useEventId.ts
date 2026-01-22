import { useSearchParams } from 'react-router-dom';

export function useEventId(): string {
  const [searchParams] = useSearchParams();
  return searchParams.get('event') || 'default';
}
