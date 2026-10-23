import { useSearchParams } from 'wouter';

import { withAuth } from '@/components/permission';
import { NotFound } from '@/components/states/NotFound';
import LocalVideoPage from './LocalVideoPage';
import Pan115VideoPage from './Pan115VideoPage';

function VideoPage() {
  const [searchParams] = useSearchParams();

  switch (searchParams.get('type')) {
    case 'local':
      return <LocalVideoPage key={searchParams.get('path')} />;
    case '115':
      return <Pan115VideoPage />;
    default:
      return <NotFound />;
  }
}

export default withAuth(VideoPage);
