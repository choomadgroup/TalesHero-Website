import { useMantineTheme, Container, Grid, Text, Button, Group, Avatar, UnstyledButton, Anchor, Code } from '@mantine/core';

const Footer = () => {
    const theme = useMantineTheme();
    
    return (
        <footer style={{ backgroundColor: theme.colors.yellow[6]}}>

            <Container>
                <Grid justify="space-around">

                    <Grid.Col xs={12} sm={8} md={8} lg={8}>
                        
                        <Text size="xl" weight={700} color="white" mb="10px">Tales Hero Indonesia</Text>

                        <Text color="white" mb="5px">
                            Tales Hero adalah sebuah game action adventure yang menawarkan petualangan dalam berbagai legenda termashur di dunia. Ayo mainkan bersama teman-temanmu!
                        </Text>

                        <Text color="white" mb="20px">
                            Ikuti kami di media sosial untuk info event dan update terbaru game.
                        </Text>

                        <Button variant="white" color="black" onClick={() => redirectToLink('#')}>Main Sekarang</Button>
                    </Grid.Col>

                    <Grid.Col xs={12} sm={4} md={4} lg={4}>
                        <Code color="yellow" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 15 }}>
                            Tales Hero Indonesia
                            <Anchor href="#">
                                <UnstyledButton>
                                    <Group>
                                        <Avatar size={40} color="orange">THI</Avatar>
                                        <div>
                                            <Text>Tales Hero Indonesia</Text>
                                            <Text size="xs" color="dimmed">support@taleshero.id</Text>
                                        </div>
                                    </Group>
                                </UnstyledButton>
                            </Anchor>
                        </Code>
                    </Grid.Col>
                </Grid>
            </Container>
        </footer>
    )
};

export default Footer;

const redirectToLink = (link: string): void => {
    window.open(link, '_blank');
};
