import { Route, Switch, Router as WouterRouter } from 'wouter';
import Home from '@/Pages/Home';
import Daftar from '@/Pages/Daftar';
import GuidesGame from '@/Pages/Guides/Game';
import NotFound from '@/Pages/Not-Found';

function Router() {
    return (
        <Switch>
            <Route path="/" component={Home} />
            <Route path="/daftar" component={Daftar} />
            <Route path="/guides/pengatar" component={GuidesGame} />
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
