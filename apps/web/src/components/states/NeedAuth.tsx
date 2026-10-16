import { Redirect, useLocation } from 'wouter';

export function NeedAuth() {
  const [location] = useLocation();

  return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
}
