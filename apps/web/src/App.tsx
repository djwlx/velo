import { LoaderCircle } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';

import { Layout } from './apps/layout';

const AuthPage = lazy(() =>
  import('./apps/auth').then((m) => ({ default: m.AuthPage }))
);
const Home = lazy(() => import('./apps/home').then((m) => ({ default: m.Home })));
const FileList115 = lazy(() =>
  import('./apps/file-list-115').then((m) => ({ default: m.FileList115 }))
);
const Pic = lazy(() => import('./apps/pic').then((m) => ({ default: m.Pic })));
const NotFound = lazy(() =>
  import('./apps/not-found').then((m) => ({ default: m.NotFound }))
);
const Setting = lazy(() =>
  import('./apps/setting').then((m) => ({ default: m.Setting }))
);
const RoleManagement = lazy(() =>
  import('./apps/setting/roles').then((m) => ({ default: m.RoleManagement }))
);
const UserInfo = lazy(() =>
  import('./apps/setting/user').then((m) => ({ default: m.UserInfo }))
);
const UserManagement = lazy(() =>
  import('./apps/setting/users').then((m) => ({ default: m.UserManagement }))
);

function App() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <Switch>
          <Route path="/login" component={AuthPage} />
          <Route path="/register" component={AuthPage} />
          <Route path="/" component={Home} />
          <Route path="/115" component={FileList115} />
          <Route path="/pic" component={Pic} />
          <Route path="/setting/users" component={UserManagement} />
          <Route path="/setting/roles" component={RoleManagement} />
          <Route path="/setting/me" component={UserInfo} />
          <Route path="/setting" component={Setting} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

export default App;
