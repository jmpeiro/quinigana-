import pool from '../../src/config/database';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('Test1234!', 12);

  // Create users
  const users = [
    { email: 'carlos@test.com', first_name: 'Carlos', last_name: 'Garcia', password_hash: hashedPassword },
    { email: 'maria@test.com', first_name: 'Maria', last_name: 'Lopez', password_hash: hashedPassword },
    { email: 'pedro@test.com', first_name: 'Pedro', last_name: 'Martinez', password_hash: hashedPassword },
    { email: 'ana@test.com', first_name: 'Ana', last_name: 'Fernandez', password_hash: hashedPassword },
    { email: 'luis@test.com', first_name: 'Luis', last_name: 'Rodriguez', password_hash: hashedPassword },
  ];

  const userIds: number[] = [];
  for (const user of users) {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [user.email]) as any[];
    if (existing.length > 0) {
      userIds.push(existing[0].id);
      console.log(`  User ${user.email} already exists (id: ${existing[0].id})`);
    } else {
      const [result] = await pool.execute(
        'INSERT INTO users (email, password_hash, first_name, last_name, auth_provider, email_verified, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.email, user.password_hash, user.first_name, user.last_name, 'local', true, true]
      ) as any[];
      userIds.push(result.insertId);
      console.log(`  Created user ${user.email} (id: ${result.insertId})`);
    }
  }

  // Make first user admin
  await pool.execute('UPDATE users SET is_admin = true WHERE id = ?', [userIds[0]]);

  // Create groups
  const groups = [
    { name: 'Los Quinielistas', description: 'Grupo de amigos para la quiniela' },
    { name: 'Futbol Total', description: 'Predicciones de futbol' },
    { name: 'Liga Masters', description: 'Solo los mejores pronosticadores' },
  ];

  const groupIds: number[] = [];
  for (const group of groups) {
    const [existing] = await pool.execute('SELECT id FROM `groups` WHERE name = ?', [group.name]) as any[];
    if (existing.length > 0) {
      groupIds.push(existing[0].id);
      console.log(`  Group "${group.name}" already exists (id: ${existing[0].id})`);
    } else {
      const [result] = await pool.execute(
        'INSERT INTO `groups` (name, description, created_by, is_active) VALUES (?, ?, ?, ?)',
        [group.name, group.description, userIds[0], true]
      ) as any[];
      groupIds.push(result.insertId);
      console.log(`  Created group "${group.name}" (id: ${result.insertId})`);
    }
  }

  // Add members to groups
  const memberships = [
    // Group 1: all 5 users
    { group_id: groupIds[0], user_id: userIds[0], role: 'admin' },
    { group_id: groupIds[0], user_id: userIds[1], role: 'member' },
    { group_id: groupIds[0], user_id: userIds[2], role: 'member' },
    { group_id: groupIds[0], user_id: userIds[3], role: 'member' },
    { group_id: groupIds[0], user_id: userIds[4], role: 'member' },
    // Group 2: 3 users
    { group_id: groupIds[1], user_id: userIds[0], role: 'admin' },
    { group_id: groupIds[1], user_id: userIds[1], role: 'member' },
    { group_id: groupIds[1], user_id: userIds[2], role: 'member' },
    // Group 3: 4 users
    { group_id: groupIds[2], user_id: userIds[1], role: 'admin' },
    { group_id: groupIds[2], user_id: userIds[2], role: 'member' },
    { group_id: groupIds[2], user_id: userIds[3], role: 'member' },
    { group_id: groupIds[2], user_id: userIds[4], role: 'member' },
  ];

  for (const m of memberships) {
    const [existing] = await pool.execute(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [m.group_id, m.user_id]
    ) as any[];
    if (existing.length === 0) {
      await pool.execute(
        'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
        [m.group_id, m.user_id, m.role]
      );
    }
  }
  console.log('  Members assigned to groups');

  // Create jornadas with matches
  const jornadas = [
    { name: 'Jornada 1', season: '2024-25', jornada_number: 1, status: 'finished', deadline: '2025-01-10 20:00:00' },
    { name: 'Jornada 2', season: '2024-25', jornada_number: 2, status: 'finished', deadline: '2025-01-17 20:00:00' },
    { name: 'Jornada 3', season: '2024-25', jornada_number: 3, status: 'open', deadline: '2025-02-01 20:00:00' },
  ];

  const jornadaIds: number[] = [];
  for (const j of jornadas) {
    const [existing] = await pool.execute(
      'SELECT id FROM jornadas WHERE name = ? AND season = ?',
      [j.name, j.season]
    ) as any[];
    if (existing.length > 0) {
      jornadaIds.push(existing[0].id);
      console.log(`  Jornada "${j.name}" already exists`);
    } else {
      const [result] = await pool.execute(
        'INSERT INTO jornadas (name, season, jornada_number, status, deadline) VALUES (?, ?, ?, ?, ?)',
        [j.name, j.season, j.jornada_number, j.status, j.deadline]
      ) as any[];
      jornadaIds.push(result.insertId);
      console.log(`  Created jornada "${j.name}" (id: ${result.insertId})`);
    }
  }

  // Create 15 matches per jornada
  const teams = [
    ['Real Madrid', 'Barcelona'], ['Atletico Madrid', 'Sevilla'], ['Valencia', 'Villarreal'],
    ['Real Sociedad', 'Athletic Bilbao'], ['Betis', 'Celta Vigo'], ['Osasuna', 'Getafe'],
    ['Rayo Vallecano', 'Mallorca'], ['Girona', 'Alaves'], ['Las Palmas', 'Cadiz'],
    ['Almeria', 'Granada'], ['Espanyol', 'Leganes'], ['Valladolid', 'Elche'],
    ['Racing', 'Sporting'], ['Huesca', 'Zaragoza'], ['Levante', 'Tenerife'],
  ];

  for (let ji = 0; ji < jornadaIds.length; ji++) {
    const [existingMatches] = await pool.execute(
      'SELECT id FROM matches WHERE jornada_id = ?',
      [jornadaIds[ji]]
    ) as any[];
    if (existingMatches.length > 0) {
      console.log(`  Matches for jornada ${ji + 1} already exist`);
      continue;
    }
    for (let mi = 0; mi < 15; mi++) {
      await pool.execute(
        'INSERT INTO matches (jornada_id, match_number, home_team, away_team) VALUES (?, ?, ?, ?)',
        [jornadaIds[ji], mi + 1, teams[mi][0], teams[mi][1]]
      );
    }
    console.log(`  Created 15 matches for jornada ${ji + 1}`);
  }

  // Add results for finished jornadas (jornada 1 & 2)
  const results1x2 = ['1', 'X', '2'];
  for (let ji = 0; ji < 2; ji++) {
    const [matches] = await pool.execute('SELECT id FROM matches WHERE jornada_id = ? ORDER BY match_number', [jornadaIds[ji]]) as any[];
    for (const match of matches) {
      const [existingResult] = await pool.execute('SELECT id FROM match_results WHERE match_id = ?', [match.id]) as any[];
      if (existingResult.length > 0) continue;
      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 4);
      const result = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';
      await pool.execute(
        'INSERT INTO match_results (match_id, home_score, away_score, result_1x2) VALUES (?, ?, ?, ?)',
        [match.id, homeScore, awayScore, result]
      );
    }
    console.log(`  Added results for jornada ${ji + 1}`);
  }

  // Create proposals for group 1 on jornadas 1 & 2
  for (let ji = 0; ji < 2; ji++) {
    const [existingP] = await pool.execute(
      'SELECT id FROM quiniela_proposals WHERE group_id = ? AND jornada_id = ?',
      [groupIds[0], jornadaIds[ji]]
    ) as any[];
    if (existingP.length > 0) {
      console.log(`  Proposal for group 1 jornada ${ji + 1} already exists`);
      continue;
    }

    const [result] = await pool.execute(
      "INSERT INTO quiniela_proposals (group_id, jornada_id, proposed_by, title, status, votes_for, votes_against, total_members_at_creation) VALUES (?, ?, ?, ?, 'approved', 4, 0, 5)",
      [groupIds[0], jornadaIds[ji], userIds[0], `Propuesta Jornada ${ji + 1}`]
    ) as any[];
    const proposalId = result.insertId;

    // Add predictions
    const [matches] = await pool.execute('SELECT id FROM matches WHERE jornada_id = ? ORDER BY match_number', [jornadaIds[ji]]) as any[];
    for (const match of matches) {
      const pred = results1x2[Math.floor(Math.random() * 3)];
      const homeP = Math.floor(Math.random() * 4);
      const awayP = Math.floor(Math.random() * 4);
      await pool.execute(
        'INSERT INTO proposal_predictions (proposal_id, match_id, prediction_1x2, home_score_prediction, away_score_prediction) VALUES (?, ?, ?, ?, ?)',
        [proposalId, match.id, pred, homeP, awayP]
      );
    }

    // Add votes
    for (let ui = 1; ui < 5; ui++) {
      await pool.execute(
        "INSERT INTO proposal_votes (proposal_id, user_id, vote) VALUES (?, ?, 'approve')",
        [proposalId, userIds[ui]]
      );
    }

    console.log(`  Created approved proposal for group 1, jornada ${ji + 1}`);
  }

  // Create scores for group 1 on finished jornadas
  for (let ji = 0; ji < 2; ji++) {
    const [existingScore] = await pool.execute(
      'SELECT id FROM group_scores WHERE group_id = ? AND jornada_id = ?',
      [groupIds[0], jornadaIds[ji]]
    ) as any[];
    if (existingScore.length > 0) continue;

    const [proposals] = await pool.execute(
      "SELECT id FROM quiniela_proposals WHERE group_id = ? AND jornada_id = ? AND status = 'approved' LIMIT 1",
      [groupIds[0], jornadaIds[ji]]
    ) as any[];
    if (proposals.length === 0) continue;

    const points = Math.floor(Math.random() * 10) + 5;
    const correct1x2 = Math.floor(Math.random() * 12) + 3;
    const correctPleno = Math.floor(Math.random() * 3);
    await pool.execute(
      'INSERT INTO group_scores (group_id, jornada_id, proposal_id, total_points, correct_1x2, correct_pleno) VALUES (?, ?, ?, ?, ?, ?)',
      [groupIds[0], jornadaIds[ji], proposals[0].id, points, correct1x2, correctPleno]
    );
    console.log(`  Created score for group 1, jornada ${ji + 1}: ${points} pts`);
  }

  // Create notifications for users
  const notificationTypes = ['new_jornada', 'proposal_submitted', 'vote_needed', 'results_published'];
  for (let ui = 0; ui < userIds.length; ui++) {
    const [existing] = await pool.execute('SELECT id FROM notifications WHERE user_id = ? LIMIT 1', [userIds[ui]]) as any[];
    if (existing.length > 0) continue;

    for (let ni = 0; ni < 3; ni++) {
      const type = notificationTypes[ni % notificationTypes.length];
      await pool.execute(
        'INSERT INTO notifications (user_id, type, title, message, is_read) VALUES (?, ?, ?, ?, ?)',
        [userIds[ui], type, `Notification ${ni + 1}`, `This is a sample ${type} notification`, ni > 0]
      );
    }
  }
  console.log('  Created sample notifications');

  console.log('\nSeed complete!');
  console.log('Test accounts (password: Test1234!):');
  users.forEach(u => console.log(`  - ${u.email}`));

  await pool.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
