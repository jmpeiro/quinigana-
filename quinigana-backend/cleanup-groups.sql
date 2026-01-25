-- Limpiar datos de quinielas de grupo
DELETE FROM group_quiniela_scores;
DELETE FROM group_quiniela_predictions;
DELETE FROM group_quiniela_matches;
DELETE FROM group_quinielas;

-- Limpiar membresías de grupo
DELETE FROM group_members;

-- Ver que quedó limpio
SELECT 'group_members' as tabla, COUNT(*) as registros FROM group_members
UNION ALL
SELECT 'group_quinielas', COUNT(*) FROM group_quinielas;
