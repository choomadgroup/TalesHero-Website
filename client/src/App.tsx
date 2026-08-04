import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { MusicProvider } from '@/Hooks/use-music';
import { AuthProvider } from '@/Hooks/use-auth';
import { useProtection } from '@/Hooks/use-protection';
import AnnouncementPopup from '@/Components/AnnouncementPopup';
import Home from '@/Pages/Home';
import Login from '@/Pages/Login';
import ForgotPassword from '@/Pages/ForgotPassword';
import ResetPasswordEmail from '@/Pages/ResetPasswordEmail';
import Daftar from '@/Pages/Daftar';
import Akun from '@/Pages/Akun';
import Download from '@/Pages/Download';
import Support from '@/Pages/Support';
import GuidesPengantar from '@/Pages/Guides/Pengantar';
import GuidesKarakter from '@/Pages/Guides/Karakter';
import NewsListPage from '@/Pages/News/NewsListPage';
import NewsArticlePage from '@/Pages/News/NewsArticlePage';
import AdminPage from '@/Pages/Admin/Admin';
import Nickname from '@/Pages/Nickname';
import NotFound from '@/Pages/Not-Found';

function Router() {
    return (
        <Switch>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPasswordEmail} />
            <Route path="/daftar" component={Daftar} />
            <Route path="/akun" component={Akun} />
            <Route path="/nickname" component={Nickname} />
            <Route path="/download" component={Download} />
            <Route path="/support" component={Support} />
            <Route path="/guides/pengantar" component={GuidesPengantar} />
            <Route path="/guides/karakter" component={GuidesKarakter} />
            <Route path="/news" component={NewsListPage} />
            <Route path="/news/:category/:slug" component={NewsArticlePage} />
            <Route path="/dashboard/admin" component={AdminPage} />
            <Route component={NotFound} />
        </Switch>
    );
}

function PopupWrapper() {
    const [location] = useLocation();
    if (location.startsWith('/dashboard')) return null;
    return <AnnouncementPopup />;
}

function App() {
    useProtection();
    return (
        <AuthProvider>
            <MusicProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                    <PopupWrapper />
                    <Router />
                </WouterRouter>
            </MusicProvider>
        </AuthProvider>
    );
}

export default App;
