#!/usr/bin/env python3
import os
import sys
import zipfile
import stat
import time

def create_sell_package():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    public_dir = os.path.join(root_dir, 'public')
    os.makedirs(public_dir, exist_ok=True)

    zip_filename = 'mundobanderas-app-codigo-fuente.zip'
    root_zip_path = os.path.join(root_dir, zip_filename)
    public_zip_path = os.path.join(public_dir, zip_filename)

    # Archivos individuales en raíz del proyecto
    root_files = [
        'package.json',
        'tsconfig.json',
        'vite.config.ts',
        'index.html',
        '.env.example',
        '.gitignore',
        'metadata.json',
        'README.md',
        'GUIA_COMERCIAL_Y_VENTA.md',
        'LICENCIA_COMERCIAL_TRANSFERENCIA.md'
    ]

    print("================================================================")
    print("Iniciando empaquetado profesional y universal de MundoBanderas...")
    print("Compatibilidad garantizada: Windows Explorer, macOS, Linux, 7-Zip")
    print("================================================================")

    temp_zip_path = os.path.join(public_dir, 'temp_package.zip')
    if os.path.exists(temp_zip_path):
        os.remove(temp_zip_path)

    added_dirs = set()

    with zipfile.ZipFile(temp_zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        # 1. Registrar archivos de raíz
        for rel_file in root_files:
            full_path = os.path.join(root_dir, rel_file)
            if os.path.exists(full_path):
                mtime = os.path.getmtime(full_path)
                dt = time.localtime(mtime)[:6]
                
                zinfo = zipfile.ZipInfo(rel_file, date_time=dt)
                zinfo.create_system = 3  # Unix
                # Unix -rw-r--r-- (0644) + DOS Archive bit (0x20)
                zinfo.external_attr = ((stat.S_IFREG | 0o644) << 16) | 0x20
                zinfo.compress_type = zipfile.ZIP_DEFLATED
                
                with open(full_path, 'rb') as f:
                    content = f.read()
                z.writestr(zinfo, content)
                print(f" + Archivo raíz: {rel_file} ({len(content)} bytes)")
            else:
                print(f" ! Archivo no encontrado en raíz: {rel_file}")

        # 2. Recorrer carpeta src/
        src_dir = os.path.join(root_dir, 'src')
        for dirpath, dirnames, filenames in os.walk(src_dir):
            dirnames[:] = [d for d in sorted(dirnames) if d not in ['.DS_Store', '__pycache__', '.git', 'node_modules']]
            
            # Asegurar que todos los subdirectorios hasta dirpath tengan su entrada en el zip
            rel_dir = os.path.relpath(dirpath, root_dir).replace(os.sep, '/').strip('/')
            if rel_dir:
                parts = rel_dir.split('/')
                curr_path = ""
                for part in parts:
                    curr_path = f"{curr_path}{part}/" if curr_path else f"{part}/"
                    if curr_path not in added_dirs:
                        d_full = os.path.join(root_dir, curr_path.rstrip('/'))
                        d_mtime = os.path.getmtime(d_full) if os.path.exists(d_full) else os.path.getmtime(dirpath)
                        d_zinfo = zipfile.ZipInfo(curr_path, date_time=time.localtime(d_mtime)[:6])
                        d_zinfo.create_system = 3
                        # Unix drwxr-xr-x (0755) + DOS Directory bit (0x10)
                        d_zinfo.external_attr = ((stat.S_IFDIR | 0o755) << 16) | 0x10
                        z.writestr(d_zinfo, b'')
                        added_dirs.add(curr_path)
                        print(f" [dir] + {curr_path}")

            # Añadir archivos dentro de la carpeta
            for filename in sorted(filenames):
                if filename in ['.DS_Store', 'Thumbs.db'] or filename.endswith('.zip'):
                    continue
                file_full = os.path.join(dirpath, filename)
                rel_path = os.path.relpath(file_full, root_dir).replace(os.sep, '/')
                
                mtime = os.path.getmtime(file_full)
                dt = time.localtime(mtime)[:6]
                
                zinfo = zipfile.ZipInfo(rel_path, date_time=dt)
                zinfo.create_system = 3
                zinfo.external_attr = ((stat.S_IFREG | 0o644) << 16) | 0x20
                zinfo.compress_type = zipfile.ZIP_DEFLATED
                
                with open(file_full, 'rb') as f:
                    content = f.read()
                z.writestr(zinfo, content)

    # 3. Verificación exhaustiva de integridad del archivo ZIP
    print("\nVerificando integridad técnica del archivo ZIP generado...")
    with zipfile.ZipFile(temp_zip_path, 'r') as z_test:
        test_result = z_test.testzip()
        if test_result is not None:
            raise RuntimeError(f"Error de integridad en archivo ZIP: {test_result}")
        
        info_list = z_test.infolist()
        total_files = len([i for i in info_list if not i.is_dir()])
        total_dirs = len([i for i in info_list if i.is_dir()])
        print(f"✅ Integridad verificada con éxito.")
        print(f"   -> Directorios estructurados: {total_dirs}")
        print(f"   -> Archivos de código y docs: {total_files}")
        print(f"   -> Total de entradas: {len(info_list)}")

    # 4. Mover a destino final en public/ y copiar a raíz
    size_mb = os.path.getsize(temp_zip_path) / (1024 * 1024)
    if os.path.exists(public_zip_path):
        os.remove(public_zip_path)
    os.rename(temp_zip_path, public_zip_path)

    with open(public_zip_path, 'rb') as f_src, open(root_zip_path, 'wb') as f_dst:
        f_dst.write(f_src.read())

    print(f"\n🎉 Paquete ZIP generado y sincronizado con éxito:")
    print(f"   -> {public_zip_path} ({size_mb:.2f} MB)")
    print(f"   -> {root_zip_path} ({size_mb:.2f} MB)")

if __name__ == '__main__':
    create_sell_package()
