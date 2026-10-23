import { lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { Route, Switch } from 'wouter';
import { useLocation } from 'wouter';
import { Layout } from './layout';
import { Loading } from './components/states/Loading';
import { NotFound } from './components/states/NotFound';
import { AuthPage } from './apps/auth';
import { Home } from './apps/home';
import FileList from './apps/files';
import FileListLocal from './apps/files/local';
import FileList115 from './apps/files/115';
import VideoPage from './apps/video';

const Setting = lazy(() => import('./apps/setting'));
const RoleManagement = lazy(() => import('./apps/setting/roles'));
const UserInfo = lazy(() => import('./apps/setting/user'));
const UserManagement = lazy(() => import('./apps/setting/users'));

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
            <Route path="/" component={Home} />
            <Route path="/login" component={AuthPage} />
            <Route path="/register" component={AuthPage} />
            <Route path="/files" component={FileList} />
            <Route path="/files/local" component={FileListLocal} />
            <Route path="/files/115" component={FileList115} />
            <Route path="/video" component={VideoPage} />
            <Route path="/setting/users" component={UserManagement} />
            <Route path="/setting/roles" component={RoleManagement} />
            <Route path="/setting/me" component={UserInfo} />
            <Route path="/setting" component={Setting} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </motion.div>
    </Layout>
  );
}

export default App;
