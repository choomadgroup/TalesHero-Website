import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '../Components/Header';
import HeroBanner from '../Components/HeroBanner';
import Announcement from '../Components/Announcement';
import Footer from '../Components/Footer';

export default function Home() {
    usePageMeta({
        title: 'Tales Hero Indonesia — Game Online Action Adventure',
        description: 'Tales Hero adalah sebuah game action adventure yang menawarkan petualangan dalam berbagai legenda termashur di dunia. Ayo mainkan bersama teman-temanmu!',
    });

    return (
        <>
            <Header light />
            <HeroBanner />
            <Announcement />
            <Footer />
        </>
    );
}
