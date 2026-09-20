import { Route, Switch } from 'wouter';
import { AuthPage } from './apps/auth';
import { Home } from './apps/home';
import { FileList115 } from './apps/file-list-115';
import { Pic } from './apps/pic';
import { NotFound } from './apps/not-found';
import { Layout } from './apps/layout';
import { Setting } from './apps/setting';
import { RoleManagement } from './apps/setting/roles';
import { UserInfo } from './apps/setting/user';
import { UserManagement } from './apps/setting/users';

function App() {
  return (
    <Layout>
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
    </Layout>
  );
}

export default App;
