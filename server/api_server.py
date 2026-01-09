"""
Flask API for Medical 3D Converter
===================================
Provides REST API endpoints to convert 2D medical images to 3D models.
Can run alongside the existing Express server.

Run with: python api_server.py
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import base64
from medical_3d_converter import Medical3DConverter

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
OUTPUT_FOLDER = os.path.join(os.path.dirname(__file__), 'outputs')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'medical-3d-converter',
        'version': '1.0.0'
    })


@app.route('/api/convert', methods=['POST'])
def convert_image():
    """
    Convert uploaded image to 3D model.
    
    Accepts:
        - multipart/form-data with 'image' file
        - JSON with 'image_base64' field
    
    Parameters (query or JSON):
        - threshold: Segmentation threshold (optional, auto if not provided)
        - simplify: Mesh simplification ratio 0-1 (default: 0.3)
        - smooth: Smoothing iterations (default: 20)
        - format: Output format 'stl' or 'obj' (default: 'stl')
    
    Returns:
        - JSON with download URL and statistics
    """
    try:
        # Get parameters
        threshold = request.args.get('threshold', type=float)
        simplify = request.args.get('simplify', default=0.3, type=float)
        smooth = request.args.get('smooth', default=20, type=int)
        output_format = request.args.get('format', default='stl')
        
        # Handle file upload
        if 'image' in request.files:
            file = request.files['image']
            filename = file.filename or 'upload.png'
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
        
        # Handle base64 encoded image
        elif request.is_json and 'image_base64' in request.json:
            image_data = request.json['image_base64']
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode and save
            import base64
            image_bytes = base64.b64decode(image_data)
            filename = request.json.get('filename', 'upload.png')
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
        else:
            return jsonify({'error': 'No image provided'}), 400
        
        # Create converter and process
        converter = Medical3DConverter()
        
        # Determine input type based on file extension
        ext = os.path.splitext(filepath)[1].lower()
        if ext in ['.dcm', '.dicom']:
            converter.load_image(filepath)  # Single DICOM file
        else:
            converter.load_image(filepath)  # PNG, JPG, etc.
        
        # Segment
        if threshold is not None:
            converter.segment(method='threshold', threshold=threshold)
        else:
            converter.segment(method='otsu')
        
        # Extract surface
        converter.extract_surface(simplify=simplify, smooth_iterations=smooth)
        
        # Generate output filename
        base_name = os.path.splitext(os.path.basename(filename))[0]
        output_filename = f"{base_name}_3d.{output_format}"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        
        # Export
        converter.export(output_path, format=output_format)
        
        # Get statistics
        stats = {
            'vertices': len(converter.vertices),
            'faces': len(converter.faces),
            'file_size_kb': os.path.getsize(output_path) / 1024
        }
        
        return jsonify({
            'success': True,
            'output_file': output_filename,
            'download_url': f'/api/download/{output_filename}',
            'statistics': stats
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/convert-dicom-folder', methods=['POST'])
def convert_dicom_folder():
    """
    Convert a folder of DICOM files to 3D model.
    
    Accepts:
        - JSON with 'folder_path' pointing to DICOM directory
    
    Returns:
        - JSON with download URL and statistics
    """
    try:
        if not request.is_json:
            return jsonify({'error': 'JSON body required'}), 400
        
        folder_path = request.json.get('folder_path')
        if not folder_path or not os.path.isdir(folder_path):
            return jsonify({'error': 'Valid folder_path required'}), 400
        
        threshold = request.json.get('threshold')
        simplify = request.json.get('simplify', 0.3)
        smooth = request.json.get('smooth', 20)
        output_format = request.json.get('format', 'stl')
        
        # Convert
        converter = Medical3DConverter()
        converter.load_dicom(folder_path)
        
        if threshold is not None:
            converter.segment(method='threshold', threshold=float(threshold))
        else:
            converter.segment(method='otsu')
        
        converter.extract_surface(simplify=simplify, smooth_iterations=smooth)
        
        # Export
        folder_name = os.path.basename(folder_path.rstrip('/\\'))
        output_filename = f"{folder_name}_3d.{output_format}"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        
        converter.export(output_path, format=output_format)
        
        return jsonify({
            'success': True,
            'output_file': output_filename,
            'download_url': f'/api/download/{output_filename}',
            'statistics': {
                'vertices': len(converter.vertices),
                'faces': len(converter.faces),
                'slices_processed': converter.volume.shape[0],
                'file_size_kb': os.path.getsize(output_path) / 1024
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download generated 3D model file."""
    filepath = os.path.join(OUTPUT_FOLDER, filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename
    )


@app.route('/api/preview/<filename>', methods=['GET'])
def preview_model(filename):
    """
    Get model data for web preview.
    Returns vertices and faces as JSON for Three.js rendering.
    """
    filepath = os.path.join(OUTPUT_FOLDER, filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    # Parse STL file to extract vertices and faces
    try:
        vertices = []
        faces = []
        
        with open(filepath, 'rb') as f:
            # Skip header
            f.read(80)
            # Read number of triangles
            import struct
            num_triangles = struct.unpack('I', f.read(4))[0]
            
            for i in range(min(num_triangles, 100000)):  # Limit for web
                # Skip normal
                f.read(12)
                # Read vertices
                for _ in range(3):
                    x, y, z = struct.unpack('fff', f.read(12))
                    vertices.append([x, y, z])
                    faces.append(len(vertices) - 1)
                # Skip attribute
                f.read(2)
        
        return jsonify({
            'success': True,
            'vertices': vertices,
            'faces': [faces[i:i+3] for i in range(0, len(faces), 3)]
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("=" * 50)
    print("Medical 3D Converter API Server")
    print("=" * 50)
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Output folder: {OUTPUT_FOLDER}")
    print("\nEndpoints:")
    print("  POST /api/convert         - Convert single image")
    print("  POST /api/convert-dicom-folder - Convert DICOM series")
    print("  GET  /api/download/<file> - Download 3D model")
    print("  GET  /api/preview/<file>  - Get model for web preview")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5001, debug=True)
