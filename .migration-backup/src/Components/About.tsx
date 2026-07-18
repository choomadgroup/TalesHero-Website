import { Text, Container, Button } from '@mantine/core';
import { MdOutlineArrowDownward } from "react-icons/md";
import { Link } from 'react-scroll';

const About = () => {
    return (
        <section id="about">
            <Container fluid>

                <div className="about-content">

                    <div style={{ marginBottom: 15 }}>
                        <Text transform="uppercase" weight={500} color="yellow">
                            GAME ONLINE ACTION ADVENTURE
                        </Text>
                    </div>


                    <div style={{ marginBottom: 25 }}>
                        <Text size="xl" color="black">
                            Tales Hero adalah sebuah game action adventure yang menawarkan petualangan dalam berbagai legenda termashur di dunia. Ayo mainkan bersama teman-temanmu!
                        </Text>
                    </div>

                    <div className="buttons">
                        <Link to="section-one" smooth duration={500}>
                            <Button color="yellow" rightIcon={<MdOutlineArrowDownward size={16} />} radius="lg" size="md">Lihat Fitur</Button>
                        </Link>

                        <Button variant="default" radius="lg" size="md">Daftar Sekarang</Button>
                    </div>

                </div>

            </Container>

        </section>
    );
};

export default About;
