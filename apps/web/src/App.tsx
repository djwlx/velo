import { lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { Route, Switch } from 'wouter';
import { useLocation } from 'wouter';
import { Layout } from './layout';
import { withAuth } from './components/permission';
import { Loading } from './components/states/Loading';
import { NotFound } from './components/states/NotFound';
import { AuthPage } from './apps/auth';
import { Home } from './apps/home';
import { FileList115 } from './apps/file-list-115';
import { LocalVideoPage } from './apps/video/LocalVideoPage';
import { Pan115VideoPage } from './apps/video/Pan115VideoPage';

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

const FileList115Page = withAuth(FileList115, { permission: 'module:115' });
const UserManagementPage = withAuth(UserManagement, {
  permission: 'module:auth',
});
const RoleManagementPage = withAuth(RoleManagement, {
  permission: 'module:auth',
});
const UserInfoPage = withAuth(UserInfo);
const SettingPage = withAuth(Setting);
const Pan115Video = withAuth(Pan115VideoPage, { permission: 'module:115' });

function App() {
  const [location] = useLocation();

  return (
    <Layout>
      <motion.div
        key={location}
        className="flex h-full min-h-0 flex-col"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Suspense fallback={<Loading />}>
          <Switch>
            <Route path="/login" component={AuthPage} />
            <Route path="/register" component={AuthPage} />
            <Route path="/" component={Home} />
            <Route path="/115" component={FileList115Page} />
            <Route path="/video/local" component={LocalVideoPage} />
            <Route path="/video/115/:pickCode" component={Pan115Video} />
            <Route path="/setting/users" component={UserManagementPage} />
            <Route path="/setting/roles" component={RoleManagementPage} />
            <Route path="/setting/me" component={UserInfoPage} />
            <Route path="/setting" component={SettingPage} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </motion.div>
    </Layout>
  );
}

export default App;
