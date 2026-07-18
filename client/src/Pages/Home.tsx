import { useEffect } from 'react';
import Header from '../Components/Header';
import About from '../Components/About';
import Footer from '../Components/Footer';

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
