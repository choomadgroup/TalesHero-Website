import { Button, Burger, Drawer, Code, Title, Anchor, Text } from '@mantine/core';
import { UnstyledButton, Group, Avatar } from '@mantine/core';
import React from 'react';
import { Link } from 'react-scroll';
import NextImage from 'next/image';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

const Header = () => {
    const [opened, setOpened] = React.useState(false);
    const title = opened ? 'Tutup navigasi' : 'Buka navigasi';
    const router = useRouter();

    return (
        <header>
            <div className="content-desktop">
                <div>
                    <NextLink href="/" style={{ display: 'inline-block' }}>
                        <NextImage
                            src="/Image/tales-hero-banner.png"
                            alt="Tales Hero Indonesia"
                            width={140}
                            height={56}
                            style={{ objectFit: 'contain' }}
                        />
                    </NextLink>
                </div>
                <div className="navbar">
                    <div className="navbar-item"><Link to="section-one" smooth duration={500}>Fitur</Link></div>
                    <div className="navbar-item"><Link to="section-four" smooth duration={500}>Game</Link></div>
                    <div className="navbar-item"><Link to="section-five" smooth duration={500}>FAQ</Link></div>

                    <Button color="yellow" onClick={() => router.push('/daftar')}>Main Sekarang</Button>
                </div>
            </div>

            <div className="content-mobile">
                <div className="burger-button">
                    <Burger
                        opened={opened}
                        onClick={() => setOpened((o) => !o)}
                        title={title}
                        size="sm"
                    />
                </div>

                <Drawer
                    transition="rotate-right"
                    transitionDuration={250}
                    transitionTimingFunction="ease"
                    overlayOpacity={0.55}
                    position="right"
                    closeButtonLabel="Tutup menu"
                    title="Menu"
                    padding="xl"
                    opened={opened}
                    onClose={() => setOpened(false)}
                >
                    <div className="menu">
                        <div className="menu-items">
                            <div className="menu-item"><Link to="section-one" smooth duration={500} onClick={() => setOpened(false)}><Title order={2}>Fitur</Title></Link></div>
                            <div className="menu-item"><Link to="section-four" smooth duration={500} onClick={() => setOpened(false)}><Title order={2}>Game</Title></Link></div>
                            <div className="menu-item"><Link to="section-five" smooth duration={500} onClick={() => setOpened(false)}><Title order={2}>FAQ</Title></Link></div>
                        </div>

                        <div className="menu-items">
                            <Text>Hubungi Kami</Text>
                            <Anchor href="mailto:support@taleshero.id">
                                support@taleshero.id
                            </Anchor>
                        </div>

                        <Code color="yellow" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 15 }}>
                            Tales Hero Indonesia
                            <UnstyledButton onClick={() => { router.push('/daftar'); setOpened(false); }}>
                                <Group>
                                    <Avatar size={40} color="orange">THI</Avatar>
                                    <div>
                                        <Text>Tales Hero Indonesia</Text>
                                        <Text size="xs" color="dimmed">support@taleshero.id</Text>
                                    </div>
                                </Group>
                            </UnstyledButton>
                        </Code>
                    </div>
                </Drawer>
            </div>
        </header>
    );
};

export default Header;
