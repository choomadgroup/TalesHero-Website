import { Route, Switch, Router as WouterRouter } from 'wouter';
import Home from '@/Pages/Home';
import Login from '@/Pages/Login';
import Daftar from '@/Pages/Daftar';
import Download from '@/Pages/Download';
import Support from '@/Pages/Support';
import GuidesPengantar from '@/Pages/Guides/Pengantar';
import GuidesKarakter from '@/Pages/Guides/Karakter';
import GuidesCombat from '@/Pages/Guides/Combat';
import GuidesItem from '@/Pages/Guides/Item';
import NotFound from '@/Pages/Not-Found';
function Router() {
    return (
        <Switch>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/daftar" component={Daftar} />
            <Route path="/download" component={Download} />
            <Route path="/support" component={Support} />
            <Route path="/guides/pengantar" component={GuidesPengantar} />
            <Route path="/guides/karakter" component={GuidesKarakter} />
            <Route path="/guides/combat" component={GuidesCombat} />
            <Route path="/guides/item" component={GuidesItem} />
            <Route component={NotFound} />
        </Switch>
    );
}

function App() {
    return (
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
        </WouterRouter>
    );
}

export default App;
