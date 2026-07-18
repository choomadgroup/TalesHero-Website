import { useEffect } from 'react';
import Header from '../components/Header';
import About from '../components/About';
import Footer from '../components/Footer';

export default function Home() {
    useEffect(() => {
        document.title = 'Tales Hero Indonesia — Game Online Action Adventure';
    }, []);

    return (
        <>
            <Header />
            <About />
            <Footer />
        </>
    );
}
