export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { nama, email, password } = body;

    if (!nama || !email || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Semua field harus diisi' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ success: false, message: 'Password minimal 8 karakter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Format email tidak valid' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Akun berhasil dibuat!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Request tidak valid' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequest(context) {
  return new Response(
    JSON.stringify({ success: false, message: 'Method tidak diizinkan' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
}
