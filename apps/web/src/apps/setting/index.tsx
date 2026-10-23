import { Redirect } from 'wouter';
import { withAuth } from '@/components/permission';

function Setting() {
  return <Redirect to="/setting/me" />;
}

export default withAuth(Setting);
