import { Router } from "express";

const leaderboardRouter = Router();

const mockLeaderboard = [
  { rank: 1,  nama: "ShadowKnight_ID",  level: 99, poin: 125000, server: "Jakarta 1",  guild: "Naga Merah" },
  { rank: 2,  nama: "NagaApiIndo",      level: 98, poin: 118500, server: "Surabaya 2", guild: "Naga Merah" },
  { rank: 3,  nama: "GarudaMerah",      level: 97, poin: 112300, server: "Bandung 1",  guild: "Garuda Sakti" },
  { rank: 4,  nama: "PetirSamudra",     level: 96, poin: 108700, server: "Jakarta 2",  guild: "Samudra Biru" },
  { rank: 5,  nama: "HeroNusantara",    level: 95, poin: 104200, server: "Medan 1",    guild: "Nusantara" },
  { rank: 6,  nama: "BintangTimur77",   level: 94, poin: 99800,  server: "Jakarta 1",  guild: "Bintang Timur" },
  { rank: 7,  nama: "SrikandiBaja",     level: 93, poin: 95600,  server: "Yogyakarta", guild: "Garuda Sakti" },
  { rank: 8,  nama: "RajaLegenda",      level: 92, poin: 91200,  server: "Surabaya 1", guild: "Raja Alam" },
  { rank: 9,  nama: "AnginRibut_X",     level: 91, poin: 87500,  server: "Bandung 2",  guild: "Angin Topan" },
  { rank: 10, nama: "PrajuritEmas",     level: 90, poin: 83100,  server: "Bali 1",     guild: "Nusantara" },
];

// GET /api/leaderboard
leaderboardRouter.get("/leaderboard", (_req, res) => {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
  return res.status(200).json({
    success: true,
    total_pemain: 2187543,
    data: mockLeaderboard,
    updated: new Date().toISOString(),
  });
});

export default leaderboardRouter;
