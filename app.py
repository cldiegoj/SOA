# app.py (Código COMPLETO y ACTUALIZADO)

from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
import sqlite3
import os
import random
import string
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://127.0.0.1:5500"}})


UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

DATABASE = 'database.db'

# --- Funciones de Base de Datos ---
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = sqlite3.connect(DATABASE) # MODIFICADO: Solo para init_db
    # conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tramites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_expediente TEXT UNIQUE NOT NULL,
            entidad_destino TEXT NOT NULL,
            oficina_destino TEXT NOT NULL,
            tipo_documento TEXT NOT NULL,
            numero_documento_remitente TEXT,
            sin_numero INTEGER,
            asunto TEXT NOT NULL,
            comentarios TEXT,
            ruta_documento_principal TEXT,
            nombre_documento_principal TEXT,
            tiene_anexos INTEGER,
            tipo_notificacion TEXT NOT NULL,
            acepta_terminos INTEGER NOT NULL,
            declaracion_jurada INTEGER NOT NULL,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            estado TEXT DEFAULT 'Pendiente'
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS anexos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tramite_id INTEGER NOT NULL,
            ruta_archivo TEXT NOT NULL,
            nombre_archivo TEXT NOT NULL,
            fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tramite_id) REFERENCES tramites (id) ON DELETE CASCADE
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Funciones Auxiliares ---
def generar_numero_expediente():
    """Genera un número de expediente único (ej: MPD/2025-ABCDE123)"""
    year = datetime.now().year
    random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=7))
    return f"MPD/{year}-{random_chars}"

# --- Rutas (Endpoints) ---

@app.route('/api/tramites/nuevo', methods=['POST'])
def registrar_nuevo_tramite():
    data = request.form
    files = request.files
    
    required_fields = ['entidadDestino', 'oficinaDestino', 'tipoDocumento', 'asunto', 'tipoNotificacion']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"message": f"Falta el campo obligatorio: {field}"}), 400

    acepta_terminos = 1 if data.get('leidoTerminos') == 'on' else 0
    declaracion_jurada = 1 if data.get('declaracionJurada') == 'on' else 0

    if not acepta_terminos or not declaracion_jurada:
        return jsonify({"message": "Debe aceptar los términos y condiciones y la declaración jurada."}), 400

    conn = get_db_connection()
    try:
        numero_expediente = generar_numero_expediente()

        ruta_doc_principal = None
        nombre_doc_principal = None
        if 'archivoPrincipal' in files:
            archivo = files['archivoPrincipal']
            if archivo.filename != '':
                filename = os.path.basename(archivo.filename)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                archivo.save(filepath)
                ruta_doc_principal = filepath
                nombre_doc_principal = filename
                print(f"--- Archivo principal '{filename}' guardado en '{filepath}' ---")

        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO tramites (
                numero_expediente, entidad_destino, oficina_destino, tipo_documento,
                numero_documento_remitente, sin_numero, asunto, comentarios,
                ruta_documento_principal, nombre_documento_principal, tiene_anexos,
                tipo_notificacion, acepta_terminos, declaracion_jurada
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            numero_expediente,
            data.get('entidadDestino'),
            data.get('oficinaDestino'),
            data.get('tipoDocumento'),
            data.get('numeroDocumento'),
            1 if data.get('sinNumero') == 'on' else 0,
            data.get('asunto'),
            data.get('comentarios'),
            ruta_doc_principal,
            nombre_doc_principal,
            1 if data.get('agregarAnexoToggle') == 'on' else 0,
            data.get('tipoNotificacion'),
            acepta_terminos,
            declaracion_jurada
        ))
        tramite_id = cursor.lastrowid
        
        conn.commit()
        print(f"--- Trámite '{numero_expediente}' insertado con ID: {tramite_id} ---")

        return jsonify({
            "message": "Trámite registrado exitosamente",
            "numero_expediente": numero_expediente
        }), 201

    except sqlite3.Error as e:
        conn.rollback()
        print(f"--- ERROR DE DB EN NUEVO TRAMITE: {e} ---")
        return jsonify({"message": f"Error al registrar el trámite: {e}"}), 500
    except Exception as e:
        conn.rollback()
        print(f"--- ERROR INESPERADO EN NUEVO TRAMITE: {e} ---")
        return jsonify({"message": f"Error interno del servidor: {e}"}), 500
    finally:
        conn.close()


@app.route('/api/tramites/buscar/<path:numero_expediente>', methods=['GET'])
def buscar_tramite(numero_expediente):
    conn = get_db_connection()
    try:
        tramite = conn.execute(
            'SELECT numero_expediente, asunto FROM tramites WHERE numero_expediente = ?',
            (numero_expediente,)
        ).fetchone()
        conn.close()

        if tramite:
            return jsonify({
                "message": "Expediente encontrado",
                "asuntoPrincipal": tramite['asunto'],
                "numeroExpediente": tramite['numero_expediente']
            }), 200
        else:
            return jsonify({"message": "Expediente no encontrado. Por favor, verifique el número."}), 404
    except Exception as e:
        print(f"--- ERROR AL BUSCAR TRAMITE: {e} ---")
        return jsonify({"message": f"Error interno del servidor al buscar: {e}"}), 500


@app.route('/api/tramites/reingresar', methods=['POST'])
def reingresar_tramite():
    print("--- Recibiendo datos para REINGRESO de Trámite ---")
    print("Form Data:", request.form)
    print("Files:", request.files)
    
    data = request.form
    files = request.files

    required_fields = ['numeroExpediente', 'tipoAccion', 'tipoDocumento', 'asunto', 'tipoNotificacion']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"message": f"Falta el campo obligatorio: {field}"}), 400

    conn = get_db_connection()
    try:
        expediente_existente = conn.execute(
            'SELECT id FROM tramites WHERE numero_expediente = ?',
            (data.get('numeroExpediente'),)
        ).fetchone()
        
        if not expediente_existente:
            print(f"--- Expediente '{data.get('numeroExpediente')}' no encontrado en DB ---")
            return jsonify({"message": "El número de expediente no existe en el sistema."}), 404
        
        tramite_id = expediente_existente['id']
        print(f"--- Expediente encontrado con ID: {tramite_id} ---")
        
        ruta_doc_principal_nuevo = None
        nombre_doc_principal_nuevo = None
        
        if 'archivoPrincipal' in files:
            archivo = files['archivoPrincipal']
            if archivo.filename != '':
                filename = os.path.basename(archivo.filename)
                filepath = os.path.join(UPLOAD_FOLDER, f"{tramite_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}")
                archivo.save(filepath)
                ruta_doc_principal_nuevo = filepath
                nombre_doc_principal_nuevo = filename
                print(f"--- Nuevo archivo adjunto '{filename}' guardado en '{filepath}' ---")

                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO anexos (tramite_id, ruta_archivo, nombre_archivo)
                    VALUES (?, ?, ?)
                ''', (
                    tramite_id,
                    ruta_doc_principal_nuevo,
                    nombre_doc_principal_nuevo
                ))
                print(f"--- Registro de anexo insertado en DB para trámite ID: {tramite_id} ---")
        else:
            print("--- No se adjuntó ningún archivo en la petición ---")
        
        conn.commit()
        
        return jsonify({
            "message": "Documento reingresado y adjuntado al expediente con éxito.",
            "numero_expediente": data.get('numeroExpediente')
        }), 200

    except sqlite3.Error as e:
        conn.rollback()
        print(f"--- ERROR DE DB AL REINGRESAR: {e} ---")
        return jsonify({"message": f"Error al reingresar el trámite: {e}"}), 500
    except Exception as e:
        conn.rollback()
        print(f"--- ERROR INESPERADO AL REINGRESAR: {e} ---")
        return jsonify({"message": f"Error interno del servidor: {e}"}), 500
    finally:
        conn.close()

# MODIFICADO: Endpoint para buscar trámites según criterios de búsqueda (Seguimiento)
@app.route('/api/tramites/buscar_seguimiento', methods=['GET'])
def buscar_seguimiento():
    # --- DEPURACIÓN ---
    print("--- INFO: Ejecutando la función buscar_seguimiento ---")
    print("--- INFO: Parámetros de búsqueda recibidos:", request.args)
    # ------------------
    
    expediente = request.args.get('expediente')
    fecha_inicio_str = request.args.get('fecha_inicio')
    fecha_fin_str = request.args.get('fecha_fin')
    entidad = request.args.get('entidad')
    terceros = request.args.get('terceros')

    query = 'SELECT * FROM tramites WHERE 1=1'
    params = []

    if expediente:
        query += ' AND numero_expediente LIKE ?'
        params.append(f'%{expediente}%')

    if fecha_inicio_str:
        query += ' AND date(fecha_creacion) >= ?'
        params.append(fecha_inicio_str)

    if fecha_fin_str:
        query += ' AND date(fecha_creacion) <= ?'
        params.append(fecha_fin_str)
    
    if entidad:
        query += ' AND entidad_destino = ?'
        params.append(entidad)
        
    if terceros == 'on':
        pass

    conn = get_db_connection()
    try:
        query += ' ORDER BY fecha_creacion DESC'
        tramites = conn.execute(query, params).fetchall()
        
        tramites_list = [dict(row) for row in tramites]
        
        return jsonify(tramites_list), 200

    except Exception as e:
        print(f"--- ERROR AL BUSCAR SEGUIMIENTO: {e} ---")
        return jsonify({"message": f"Error interno del servidor al buscar: {e}"}), 500
    finally:
        conn.close()

# MODIFICADO: Endpoint para obtener todos los detalles de un trámite y sus anexos
# NOTA: La ruta es /detalle/, no /detalles/
@app.route('/api/tramites/detalle/<path:numero_expediente>', methods=['GET'])
def get_tramite_detalle(numero_expediente):
    conn = get_db_connection()
    try:
        # Buscar el trámite principal
        tramite = conn.execute('SELECT * FROM tramites WHERE numero_expediente = ?', (numero_expediente,)).fetchone()
        
        if not tramite:
            print(f"--- DETALLE: Expediente '{numero_expediente}' no encontrado en DB ---")
            return jsonify({"message": "Expediente no encontrado."}), 404
            
        tramite_dict = dict(tramite) # Convertir Row a diccionario
        tramite_id = tramite_dict['id']

        # Buscar todos los anexos relacionados con este trámite
        anexos = conn.execute('SELECT ruta_archivo, nombre_archivo FROM anexos WHERE tramite_id = ?', (tramite_id,)).fetchall()
        
        # Convertir los anexos a una lista de diccionarios
        anexos_list = [dict(row) for row in anexos]

        # Añadir la lista de anexos al diccionario del trámite
        tramite_dict['anexos_adjuntos'] = anexos_list
        
        return jsonify(tramite_dict), 200
        
    except Exception as e:
        print(f"--- ERROR AL OBTENER DETALLES DEL TRAMITE: {e} ---")
        return jsonify({"message": f"Error interno del servidor al obtener detalles: {e}"}), 500
    finally:
        conn.close()


# NUEVO: Endpoint para servir archivos de la carpeta 'uploads'
@app.route('/uploads/<path:filename>')
def download_file(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify({"message": "Archivo no encontrado"}), 404


# NUEVO: Función de depuración para listar todas las rutas registradas
def list_routes():
    print("--- RUTAS REGISTRADAS EN FLASK ---")
    for rule in app.url_map.iter_rules():
        print(f"Endpoint: {rule.endpoint} | Methods: {', '.join(rule.methods)} | Path: {rule.rule}")
    print("---------------------------------")


if __name__ == '__main__':
    # MODIFICADO: Llamamos a la función de depuración de rutas al iniciar
    list_routes()
    app.run(debug=True, host='127.0.0.1', port=5000, use_reloader=False)
