-- ========================================
-- TABLAS PRINCIPALES
-- ========================================

-- CLASIFICACIÓN
CREATE TABLE Clasificacion (
    cla_id SERIAL PRIMARY KEY,
    cla_nombre VARCHAR(255) NOT NULL
);

-- ARTISTA
CREATE TABLE Artista (
    art_id SERIAL PRIMARY KEY,
    art_nombre VARCHAR(255) NOT NULL
);

-- LUGAR
CREATE TABLE Lugar (
    lu_id SERIAL PRIMARY KEY,
    lu_nombre VARCHAR(255) NOT NULL,
    lu_tipo VARCHAR(100),
    lu_fk INT,
    FOREIGN KEY (lu_fk) REFERENCES Lugar(lu_id)
);

-- OBRA
CREATE TABLE Obra (
    obr_id SERIAL PRIMARY KEY,
    obr_mcf VARCHAR(255) NOT NULL,
    obr_numeros_anteriores VARCHAR(255),
    obr_titulo VARCHAR(255) NOT NULL,
    obr_fecha_realizacion VARCHAR(255),
    obr_alto_cm VARCHAR(255),
    obr_ancho_cm VARCHAR(255),
    obr_profundidad_cm VARCHAR(255),
    obr_diametro_cm VARCHAR(255),
    obr_descripcion_formal TEXT,
    obr_observaciones TEXT,
    obr_url_foto VARCHAR(500),
    obr_estado_condicion VARCHAR(100),
    obr_estado_integridad VARCHAR(100),
    obr_procedencia VARCHAR(255),
    obr_cultura_tradicion VARCHAR(255),
    obr_epoca_estilo VARCHAR(255),
    obr_valor_avaluo VARCHAR(255),
    obr_moneda_avaluo VARCHAR(50),
    obr_responsable_avaluo VARCHAR(255),
    obr_fecha_avaluo VARCHAR(255),
    obr_propietario_original VARCHAR(255),
    obr_documentos_relacionados TEXT,
    obr_bibliografia TEXT,
    obr_fecha_ingreso VARCHAR(255),
    obr_fuente_adquisicion VARCHAR(255),
    obr_metodo_adquisicion VARCHAR(255),
    obr_entidad_responsable VARCHAR(255),
    
    -- Campos añadidos desde el formulario
    obr_detalles_firma TEXT,
    obr_exposiciones TEXT,
    obr_tratamientos TEXT,

    -- Claves Foráneas
    obr_cla_fk INT,
    obr_art_fk INT,
    obr_lu_fk INT,
    FOREIGN KEY (obr_cla_fk) REFERENCES Clasificacion(cla_id),
    FOREIGN KEY (obr_art_fk) REFERENCES Artista(art_id),
    FOREIGN KEY (obr_lu_fk) REFERENCES Lugar(lu_id)
);


-- MATERIAL
CREATE TABLE Material (
    mat_id SERIAL PRIMARY KEY,
    mat_nombre VARCHAR(255) NOT NULL
);

-- TECNICA
CREATE TABLE Tecnica (
    tec_id SERIAL PRIMARY KEY,
    tec_nombre VARCHAR(255) NOT NULL
);

-- PERSONA EXTERNA
CREATE TABLE Persona_externa (
    per_ext_id SERIAL PRIMARY KEY,
    per_ext_nombre VARCHAR(255) NOT NULL,
    per_ext_cedula VARCHAR(20) UNIQUE NOT NULL,
    per_ext_telefono VARCHAR(20)
);

-- ROL
CREATE TABLE Rol (
    rol_id SERIAL PRIMARY KEY,
    rol_nombre VARCHAR(100) NOT NULL
);

-- USUARIO
CREATE TABLE Usuario (
    usu_id SERIAL PRIMARY KEY,
    usu_nombre_usuario VARCHAR(100) UNIQUE NOT NULL,
    usu_nombre_completo VARCHAR(255),
    usu_contraseña VARCHAR(255) NOT NULL,
    usu_fecha_creacion DATE DEFAULT CURRENT_DATE,
    usu_activo BOOLEAN DEFAULT TRUE,
    usu_rol_id_fk INT NOT NULL,
    FOREIGN KEY (usu_rol_id_fk) REFERENCES Rol(rol_id)
);

-- PRIVILEGIOS
CREATE TABLE Privilegios (
    priv_id SERIAL PRIMARY KEY,
    priv_nombre VARCHAR(100) NOT NULL,
    priv_descripcion TEXT
);

-- ========================================
-- TABLAS RELACIONALES (N:N)
-- ========================================

-- OBRA_MATERIAL
CREATE TABLE Obra_material (
    obr_id_fk INT NOT NULL,
    mat_id_fk INT NOT NULL,
    PRIMARY KEY (obr_id_fk, mat_id_fk),
    FOREIGN KEY (obr_id_fk) REFERENCES Obra(obr_id),
    FOREIGN KEY (mat_id_fk) REFERENCES Material(mat_id)
);

-- OBRA_TECNICA
CREATE TABLE Obra_tecnica (
    obr_tec_obr_fk INT NOT NULL,
    obr_tec_tec_fk INT NOT NULL,
    PRIMARY KEY (obr_tec_obr_fk, obr_tec_tec_fk),
    FOREIGN KEY (obr_tec_obr_fk) REFERENCES Obra(obr_id),
    FOREIGN KEY (obr_tec_tec_fk) REFERENCES Tecnica(tec_id)
);

-- ROL_PRIVILEGIO
CREATE TABLE Rol_Privilegio (
    rol_id_fk INT NOT NULL,
    priv_id_fk INT NOT NULL,
    PRIMARY KEY (rol_id_fk, priv_id_fk),
    FOREIGN KEY (rol_id_fk) REFERENCES Rol(rol_id),
    FOREIGN KEY (priv_id_fk) REFERENCES Privilegios(priv_id)
);

-- ========================================
-- HISTORIALES
-- ========================================

-- HISTORIAL MOVIMIENTO
CREATE TABLE Historial_movimiento (
    -- ¡NUEVO! Se añade un ID único para cada movimiento.
    his_mov_id SERIAL PRIMARY KEY,

    -- Se cambia el tipo de dato a TIMESTAMP para guardar la hora exacta.
    his_mov_fecha TIMESTAMP NOT NULL,

    his_tip_movimiento VARCHAR(100) NOT NULL,
    his_mov_motiv TEXT,
    his_mov_notas TEXT,
    his_mov_obr_id_fk INT NOT NULL,
    his_mov_envia_fk INT,
    his_mov_usu_id_fk INT NOT NULL,
    his_mov_recibe_fk INT,

    -- Se eliminó la clave primaria compuesta que causaba el error.
    
    FOREIGN KEY (his_mov_obr_id_fk) REFERENCES Obra(obr_id),
    FOREIGN KEY (his_mov_envia_fk) REFERENCES Persona_externa(per_ext_id),
    FOREIGN KEY (his_mov_usu_id_fk) REFERENCES Usuario(usu_id),
    FOREIGN KEY (his_mov_recibe_fk) REFERENCES Persona_externa(per_ext_id)
);

-- HISTORIAL MANTENIMIENTO
CREATE TABLE Historial_mantenimiento (
    his_man_id SERIAL PRIMARY KEY, -- ID único para cada registro
    his_man_fecha DATE NOT NULL,
    his_man_categoria VARCHAR(100),
    his_man_descripcion_intervencion TEXT,
    his_man_precio VARCHAR(250), -- Nuevo campo para el precio
    his_man_obr_fk INT NOT NULL,
    his_man_usu_fk INT NOT NULL,
    FOREIGN KEY (his_man_obr_fk) REFERENCES Obra(obr_id),
    FOREIGN KEY (his_man_usu_fk) REFERENCES Usuario(usu_id)
);


CREATE TABLE Historial_Inventario (
    -- ID único para cada registro de inventario.
    his_inv_id SERIAL PRIMARY KEY,

    -- Fecha en que se realizó el inventario.
    his_inv_fecha DATE NOT NULL,

    -- Nombre de la persona que realizó el inventario.
    his_inv_responsable VARCHAR(255),

    -- Nombre del supervisor que verificó el inventario.
    his_inv_supervisor VARCHAR(255),

    -- Fecha en que el supervisor realizó la verificación.
    his_inv_fecha_supervisor DATE,

    -- Clave foránea para vincular el registro con la obra correspondiente.
    his_inv_obr_fk INT NOT NULL,

    -- Clave foránea para saber qué usuario del sistema registró el inventario.
    his_inv_usu_fk INT NOT NULL,

    -- Definición de las restricciones de clave foránea.
    FOREIGN KEY (his_inv_obr_fk) REFERENCES Obra(obr_id),
    FOREIGN KEY (his_inv_usu_fk) REFERENCES Usuario(usu_id)
);

