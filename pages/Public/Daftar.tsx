import Head from 'next/head';
import { useState } from 'react';
import { TextInput, PasswordInput, Button, Container, Title, Text, Paper, Anchor, Alert } from '@mantine/core';
import { useRouter } from 'next/router';
import NextLink from 'next/link';

export default function Daftar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nama: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Terjadi kesalahan, coba lagi.');
      }
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Daftar Hero — Tales Hero Indonesia</title>
        <meta name="description" content="Daftar sekarang dan bergabunglah dalam petualangan Tales Hero Indonesia!" />
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgb(248, 246, 246)',
        padding: '20px',
      }}>
        <Container size="xs" style={{ width: '100%' }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <NextLink href="/">
              <img src="/Image/tales-hero-banner.png" alt="Tales Hero Indonesia" style={{ width: 200, cursor: 'pointer' }} />
            </NextLink>
          </div>

          <Paper shadow="md" p="xl" radius="md">
            <Title order={2} align="center" mb={4}>Buat Akun Hero</Title>
            <Text color="dimmed" size="sm" align="center" mb="lg">
              Bergabunglah dalam petualangan legenda bersama jutaan hero Indonesia!
            </Text>

            {success ? (
              <div style={{ textAlign: 'center' }}>
                <Text size="xl" mb="sm">🎉</Text>
                <Text size="lg" color="green" weight={600}>Akun berhasil dibuat!</Text>
                <Text mt="sm" color="dimmed">Selamat datang di Tales Hero Indonesia. Petualanganmu dimulai sekarang!</Text>
                <Button color="yellow" mt="lg" fullWidth radius="md" onClick={() => router.push('/')}>
                  Kembali ke Beranda
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert color="red" mb="md" radius="md">{error}</Alert>
                )}
                <TextInput
                  label="Nama Hero"
                  placeholder="Masukkan nama heromu"
                  required
                  mb="md"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
                <TextInput
                  label="Email"
                  placeholder="email@example.com"
                  type="email"
                  required
                  mb="md"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <PasswordInput
                  label="Password"
                  placeholder="Minimal 8 karakter"
                  required
                  mb="xl"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <Button type="submit" color="yellow" fullWidth radius="md" loading={loading} size="md">
                  ⚔️ Mulai Petualangan!
                </Button>
              </form>
            )}

            <Text align="center" mt="md" size="sm" color="dimmed">
              Sudah punya akun?{' '}
              <Anchor color="yellow" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
                Kembali ke Beranda
              </Anchor>
            </Text>
          </Paper>

        </Container>
      </div>
    </>
  );
}
