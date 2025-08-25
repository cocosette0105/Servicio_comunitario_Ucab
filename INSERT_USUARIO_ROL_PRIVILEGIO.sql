INSERT INTO Rol (rol_nombre) VALUES ('desarrollador');
INSERT INTO Rol (rol_nombre) VALUES
('administrador'),
('supervisor'),
('colaborador');

-- =========================================================
-- PASO 2: Inserta los privilegios específicos
-- =========================================================
INSERT INTO Privilegios (priv_nombre, priv_descripcion) VALUES 
('gestionar_usuarios', 'Permite gestionar la creación, modificación y eliminación de usuarios.'),
('crear_obra', 'Permite crear nuevas obras de arte.'),
('leer_obra', 'Permite leer y consultar los detalles de las obras.'),
('actualizar_obra', 'Permite modificar la información de una obra.'),
('eliminar_obra', 'Permite eliminar una obra de arte.'),
('registrar_movimiento', 'Permite registrar un evento de movimiento en el historial.'),
('leer_historial_movimiento', 'Permite leer el historial de movimiento.'),
('registrar_mantenimiento', 'Permite registrar un evento de mantenimiento en el historial.'),
('leer_historial_mantenimiento', 'Permite leer el historial de mantenimiento.'),
('generar_reportes', 'Permite generar reportes de la base de datos.');


-- =========================================================
-- PASO 3: Relaciona el rol 'desarrollador' con los privilegios
-- =========================================================
-- **IMPORTANTE:** Reemplaza 'id_rol_desarrollador' y 'id_privilegio' con los IDs reales
-- que generó tu base de datos en los pasos 1 y 2.
-- Ejemplo: Si el rol 'desarrollador' tiene ID 1 y 'crear_obra' tiene ID 2, usa (1, 2).
-- Puedes obtener los IDs usando consultas como SELECT * FROM Rol; y SELECT * FROM Privilegios;

INSERT INTO Rol_Privilegio (rol_id_fk, priv_id_fk) VALUES 
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10);

INSERT INTO Rol_Privilegio (rol_id_fk, priv_id_fk)
VALUES
((SELECT rol_id FROM Rol WHERE rol_nombre = 'administrador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'gestionar_usuarios')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'administrador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'crear_obra')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'administrador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'leer_obra')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'administrador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'actualizar_obra')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'administrador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'eliminar_obra')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'administrador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'registrar_movimiento')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'administrador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'leer_historial_movimiento')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'administrador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'registrar_mantenimiento')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'administrador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'leer_historial_mantenimiento')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'administrador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'generar_reportes'));

-- Asignar privilegios al rol 'supervisor'
-- No tiene 'gestionar_usuarios' (ID 1), pero sí todos los demás.
INSERT INTO Rol_Privilegio (rol_id_fk, priv_id_fk)
VALUES
((SELECT rol_id FROM Rol WHERE rol_nombre = 'supervisor'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'crear_obra')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'supervisor'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'leer_obra')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'supervisor'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'actualizar_obra')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'supervisor'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'eliminar_obra')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'supervisor'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'registrar_movimiento')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'supervisor'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'leer_historial_movimiento')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'supervisor'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'registrar_mantenimiento')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'supervisor'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'leer_historial_mantenimiento')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'supervisor'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'generar_reportes'));

-- Asignar privilegios al rol 'colaborador'
-- Solo tiene privilegios esenciales para sus tareas diarias.
INSERT INTO Rol_Privilegio (rol_id_fk, priv_id_fk)
VALUES
((SELECT rol_id FROM Rol WHERE rol_nombre = 'colaborador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'leer_obra')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'colaborador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'registrar_movimiento')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'colaborador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'leer_historial_movimiento')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'colaborador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'registrar_mantenimiento')),
((SELECT rol_id FROM Rol WHERE rol_nombre = 'colaborador'), (SELECT priv_id FROM Privilegios WHERE priv_nombre = 'leer_historial_mantenimiento'));

-- La contraseña 'fefy1234' ha sido hasheada con bcrypt para mayor seguridad.
-- Este es el hash que debes guardar en la base de datos.
-- Puedes usar un script de Python (como el que te mostré anteriormente) para generar tus propios hashes.
-- Hash: $2a$10$tJ96R6D/qVw0J8U/oNl2v.gW.E1Jj8j.Fk.uM.ZJ.l9C4zO0b.r
INSERT INTO Usuario (usu_nombre_usuario, usu_nombre_completo, usu_contraseña, usu_rol_id_fk) VALUES 
('Josue', 'Josue Carrero', '$2b$10$ndlrb11Vqvrwh0LyXmRTJeHjGWWjw4pL5lzYCurT7v.cLmeCBb4Jq', 1),
('Mafer', 'Mafer Suarez', '$2b$10$ndlrb11Vqvrwh0LyXmRTJeHjGWWjw4pL5lzYCurT7v.cLmeCBb4Jq', 1);
