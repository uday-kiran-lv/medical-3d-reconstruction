"""
Medical 2D to 3D Converter (OPTIMIZED FOR SPEED)
=================================================
Converts 2D medical scan images (CT/MRI slices) into 3D models.
FAST version with parallel processing and optimized algorithms.

Libraries used: pydicom, numpy, scikit-image, matplotlib, vtk
"""

import os
import glob
import numpy as np
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp

# ============================================================================
# STEP 1: IMPORT REQUIRED LIBRARIES
# ============================================================================
try:
    import pydicom
    PYDICOM_AVAILABLE = True
except ImportError:
    PYDICOM_AVAILABLE = False

from skimage import measure, filters, morphology
from skimage.segmentation import clear_border
from skimage.io import imread
from skimage.transform import resize, downscale_local_mean
from scipy import ndimage

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

try:
    import vtk
    from vtk.util import numpy_support
    VTK_AVAILABLE = True
except ImportError:
    VTK_AVAILABLE = False

# Try to import numba for JIT compilation (optional but faster)
try:
    from numba import jit, prange
    NUMBA_AVAILABLE = True
except ImportError:
    NUMBA_AVAILABLE = False
    # Create dummy decorator
    def jit(*args, **kwargs):
        def decorator(func):
            return func
        return decorator
    prange = range


# ============================================================================
# STEP 2: READ 2D SLICES - OPTIMIZED WITH PARALLEL LOADING
# ============================================================================
class MedicalImageReader:
    """Fast medical image reader with parallel file loading."""
    
    @staticmethod
    def _read_single_dicom(filepath):
        """Helper to read single DICOM file."""
        try:
            ds = pydicom.dcmread(filepath)
            pos = float(ds.ImagePositionPatient[2]) if hasattr(ds, 'ImagePositionPatient') else 0
            return (pos, ds.pixel_array, ds)
        except:
            return None
    
    @staticmethod
    def read_dicom_series(directory: str, max_slices: int = 200) -> tuple:
        """Read DICOM series with parallel loading for speed."""
        if not PYDICOM_AVAILABLE:
            raise ImportError("pydicom required")
        
        print(f"⚡ Fast-loading DICOM from: {directory}")
        
        # Find DICOM files
        dicom_files = []
        for ext in ['*.dcm', '*.DCM', '*.dicom', '*']:
            dicom_files.extend(glob.glob(os.path.join(directory, ext)))
        
        # Parallel read with ThreadPool (I/O bound)
        with ThreadPoolExecutor(max_workers=8) as executor:
            results = list(executor.map(MedicalImageReader._read_single_dicom, dicom_files))
        
        # Filter valid results and sort
        valid = [r for r in results if r is not None]
        valid.sort(key=lambda x: x[0])
        
        if not valid:
            raise ValueError(f"No valid DICOM files in {directory}")
        
        # Subsample if too many slices (speed optimization)
        if len(valid) > max_slices:
            step = len(valid) // max_slices
            valid = valid[::step]
        
        print(f"   Loaded {len(valid)} slices")
        
        # Stack volume
        volume = np.stack([v[1] for v in valid], axis=0).astype(np.float32)
        
        # Get spacing
        ds = valid[0][2]
        spacing = [1.0, 1.0, 1.0]
        try:
            spacing[0] = float(ds.SliceThickness) if hasattr(ds, 'SliceThickness') else 1.0
            if hasattr(ds, 'PixelSpacing'):
                spacing[1:3] = [float(x) for x in ds.PixelSpacing]
        except:
            pass
        
        # Rescale
        if hasattr(ds, 'RescaleSlope'):
            volume = volume * ds.RescaleSlope + ds.RescaleIntercept
        
        return volume, spacing
    
    @staticmethod
    def read_png_series(directory: str, pattern: str = "*.png", max_slices: int = 150) -> tuple:
        """Fast PNG series reading with parallel loading."""
        print(f"⚡ Fast-loading PNG from: {directory}")
        
        png_files = sorted(glob.glob(os.path.join(directory, pattern)))
        if not png_files:
            raise ValueError(f"No PNG files found")
        
        # Subsample if needed
        if len(png_files) > max_slices:
            step = len(png_files) // max_slices
            png_files = png_files[::step]
        
        # Parallel read
        def read_png(f):
            return imread(f, as_gray=True)
        
        with ThreadPoolExecutor(max_workers=8) as executor:
            slices = list(executor.map(read_png, png_files))
        
        volume = np.stack(slices, axis=0).astype(np.float32)
        if volume.max() <= 1.0:
            volume *= 255
        
        print(f"   Loaded {len(slices)} slices, shape: {volume.shape}")
        return volume, [1.0, 1.0, 1.0]
    
    @staticmethod
    def read_single_image(filepath: str, target_size: int = 256) -> tuple:
        """Fast single image loading with reduced resolution."""
        print(f"⚡ Fast-loading image: {filepath}")
        
        if filepath.lower().endswith(('.dcm', '.dicom')):
            ds = pydicom.dcmread(filepath)
            img = ds.pixel_array.astype(np.float32)
        else:
            img = imread(filepath, as_gray=True).astype(np.float32)
            if img.max() <= 1.0:
                img *= 255
        
        # Downsample large images for speed
        if max(img.shape) > target_size:
            scale = target_size / max(img.shape)
            img = resize(img, (int(img.shape[0]*scale), int(img.shape[1]*scale)), 
                        anti_aliasing=True, preserve_range=True)
        
        # Create pseudo-3D volume (fewer slices for speed)
        num_slices = 15  # Reduced from 20
        volume_slices = []
        
        for i in range(num_slices):
            dist = abs(i - num_slices // 2) / (num_slices // 2)
            if dist > 0:
                slice_img = ndimage.gaussian_filter(img, sigma=dist * 1.5) * (1 - dist * 0.4)
            else:
                slice_img = img.copy()
            volume_slices.append(slice_img)
        
        volume = np.stack(volume_slices, axis=0)
        print(f"   Volume shape: {volume.shape}")
        return volume, [1.0, 1.0, 1.0]


# ============================================================================
# STEP 3: FAST SEGMENTATION
# ============================================================================
class OrganSegmentation:
    """Fast segmentation with optimized algorithms."""
    
    @staticmethod
    def threshold_segmentation(volume: np.ndarray, 
                                threshold: float = None,
                                method: str = 'otsu') -> np.ndarray:
        """Fast threshold segmentation using vectorized operations."""
        print("⚡ Fast threshold segmentation...")
        
        if threshold is None:
            # Fast Otsu on downsampled data
            sample = volume[::2, ::2, ::2].ravel()
            threshold = filters.threshold_otsu(sample)
            print(f"   Threshold: {threshold:.2f}")
        
        # Vectorized thresholding (very fast)
        binary_mask = (volume > threshold).astype(np.uint8)
        print(f"   Segmented: {np.sum(binary_mask):,} voxels")
        
        return binary_mask
    
    @staticmethod
    def fast_region_growing(volume: np.ndarray, 
                            seed_point: tuple = None,
                            tolerance: float = 50) -> np.ndarray:
        """Optimized region growing using scipy ndimage."""
        print("⚡ Fast region growing...")
        
        if seed_point is None:
            seed_point = tuple(s // 2 for s in volume.shape)
        
        seed_value = volume[seed_point]
        
        # Create mask of similar intensity (vectorized)
        similarity_mask = np.abs(volume - seed_value) <= tolerance
        
        # Use scipy's label to find connected components
        labeled, num_features = ndimage.label(similarity_mask)
        
        # Get the label at seed point
        seed_label = labeled[seed_point]
        
        # Return only the connected region containing seed
        mask = (labeled == seed_label).astype(np.uint8)
        print(f"   Segmented: {np.sum(mask):,} voxels")
        
        return mask
    
    @staticmethod
    def morphological_cleanup(mask: np.ndarray, 
                               remove_small: int = 500,
                               fast_mode: bool = True) -> np.ndarray:
        """Fast morphological cleanup."""
        print("⚡ Fast cleanup...")
        
        if fast_mode:
            # Simplified fast cleanup
            # Binary opening to remove small noise
            struct = ndimage.generate_binary_structure(3, 1)
            mask = ndimage.binary_opening(mask, struct, iterations=1)
            
            # Binary closing to fill small holes
            mask = ndimage.binary_closing(mask, struct, iterations=1)
            
            # Remove small objects using scipy (faster than skimage)
            labeled, num = ndimage.label(mask)
            sizes = ndimage.sum(mask, labeled, range(1, num + 1))
            
            # Keep only large objects
            mask_sizes = sizes >= remove_small
            mask = mask_sizes[(labeled - 1).clip(0)]
        else:
            # Original slower but more thorough cleanup
            mask = clear_border(mask)
            mask = morphology.remove_small_objects(mask.astype(bool), min_size=remove_small)
            mask = morphology.remove_small_holes(mask, area_threshold=remove_small)
            struct_elem = morphology.ball(1)
            mask = morphology.binary_closing(mask, struct_elem)
        
        print(f"   Final: {np.sum(mask):,} voxels")
        return mask.astype(np.uint8)


# ============================================================================
# STEP 4: FAST MARCHING CUBES
# ============================================================================
class SurfaceExtraction:
    """Fast 3D surface extraction with optimized marching cubes."""
    
    @staticmethod
    def marching_cubes(volume: np.ndarray, 
                       level: float = 0.5,
                       spacing: tuple = (1.0, 1.0, 1.0),
                       step_size: int = 2,
                       fast_mode: bool = True) -> tuple:
        """
        Fast marching cubes with optional downsampling.
        step_size=2 is 4x faster than step_size=1 with minimal quality loss.
        """
        print("⚡ Fast marching cubes...")
        
        # Light smoothing (sigma=0.5 instead of 1 for speed)
        if fast_mode:
            smoothed = ndimage.gaussian_filter(volume.astype(np.float32), sigma=0.5)
        else:
            smoothed = filters.gaussian(volume.astype(np.float32), sigma=1)
        
        # Marching cubes with larger step size for speed
        vertices, faces, normals, values = measure.marching_cubes(
            smoothed,
            level=level,
            spacing=spacing,
            step_size=step_size,
            allow_degenerate=False
        )
        
        print(f"   Vertices: {len(vertices):,}, Faces: {len(faces):,}")
        return vertices, faces, normals, values
    
    @staticmethod
    def simplify_mesh(vertices: np.ndarray, 
                      faces: np.ndarray,
                      target_reduction: float = 0.5) -> tuple:
        """Fast mesh decimation using VTK."""
        if not VTK_AVAILABLE:
            return vertices, faces
        
        print(f"⚡ Fast mesh simplification ({target_reduction*100:.0f}% reduction)...")
        
        # Create VTK polydata
        vtk_points = vtk.vtkPoints()
        vtk_points.SetData(numpy_support.numpy_to_vtk(vertices))
        
        vtk_cells = vtk.vtkCellArray()
        # Faster: bulk insert cells
        cells_array = np.column_stack([
            np.full(len(faces), 3),
            faces
        ]).astype(np.int64).ravel()
        vtk_cells.SetCells(len(faces), numpy_support.numpy_to_vtkIdTypeArray(cells_array))
        
        polydata = vtk.vtkPolyData()
        polydata.SetPoints(vtk_points)
        polydata.SetPolys(vtk_cells)
        
        # Fast quadric decimation
        decimate = vtk.vtkQuadricDecimation()
        decimate.SetInputData(polydata)
        decimate.SetTargetReduction(target_reduction)
        decimate.Update()
        
        output = decimate.GetOutput()
        
        # Fast extraction back to numpy
        new_vertices = numpy_support.vtk_to_numpy(output.GetPoints().GetData())
        
        # Extract faces
        n_cells = output.GetNumberOfCells()
        new_faces = []
        for i in range(n_cells):
            cell = output.GetCell(i)
            if cell.GetNumberOfPoints() == 3:
                new_faces.append([cell.GetPointId(j) for j in range(3)])
        
        print(f"   Reduced to {len(new_vertices):,} vertices, {len(new_faces):,} faces")
        return new_vertices, np.array(new_faces)
    
    @staticmethod
    def smooth_mesh(vertices: np.ndarray, 
                    faces: np.ndarray,
                    iterations: int = 10) -> np.ndarray:
        """Fast Laplacian smoothing (reduced iterations)."""
        if not VTK_AVAILABLE:
            return vertices
        
        print(f"⚡ Fast smoothing ({iterations} iterations)...")
        
        vtk_points = vtk.vtkPoints()
        vtk_points.SetData(numpy_support.numpy_to_vtk(vertices))
        
        vtk_cells = vtk.vtkCellArray()
        cells_array = np.column_stack([
            np.full(len(faces), 3),
            faces
        ]).astype(np.int64).ravel()
        vtk_cells.SetCells(len(faces), numpy_support.numpy_to_vtkIdTypeArray(cells_array))
        
        polydata = vtk.vtkPolyData()
        polydata.SetPoints(vtk_points)
        polydata.SetPolys(vtk_cells)
        
        smoother = vtk.vtkSmoothPolyDataFilter()
        smoother.SetInputData(polydata)
        smoother.SetNumberOfIterations(iterations)
        smoother.SetRelaxationFactor(0.15)  # Slightly more aggressive
        smoother.FeatureEdgeSmoothingOff()
        smoother.BoundarySmoothingOn()
        smoother.Update()
        
        return numpy_support.vtk_to_numpy(smoother.GetOutput().GetPoints().GetData())


# ============================================================================
# STEP 5: FAST STL EXPORT
# ============================================================================
class ModelExporter:
    """Fast 3D model export using vectorized numpy operations."""
    
    @staticmethod
    def export_stl(vertices: np.ndarray, 
                   faces: np.ndarray,
                   filename: str,
                   binary: bool = True) -> str:
        """Fast binary STL export using vectorized numpy."""
        print(f"⚡ Fast STL export: {filename}")
        
        if not filename.lower().endswith('.stl'):
            filename += '.stl'
        
        # Get triangle vertices (vectorized)
        triangles = vertices[faces]  # Shape: (n_faces, 3, 3)
        
        # Calculate normals (vectorized)
        v0, v1, v2 = triangles[:, 0], triangles[:, 1], triangles[:, 2]
        edge1 = v1 - v0
        edge2 = v2 - v0
        normals = np.cross(edge1, edge2)
        norms = np.linalg.norm(normals, axis=1, keepdims=True)
        norms[norms == 0] = 1  # Avoid division by zero
        normals = normals / norms
        
        if binary:
            n_faces = len(faces)
            # Pre-allocate buffer
            record_dtype = np.dtype([
                ('normal', np.float32, (3,)),
                ('v0', np.float32, (3,)),
                ('v1', np.float32, (3,)),
                ('v2', np.float32, (3,)),
                ('attr', np.uint16)
            ])
            
            records = np.zeros(n_faces, dtype=record_dtype)
            records['normal'] = normals.astype(np.float32)
            records['v0'] = v0.astype(np.float32)
            records['v1'] = v1.astype(np.float32)
            records['v2'] = v2.astype(np.float32)
            
            with open(filename, 'wb') as f:
                # Header
                f.write(b'Binary STL - Fast Export' + b'\0' * 56)
                # Triangle count
                f.write(np.uint32(n_faces).tobytes())
                # All triangles at once
                f.write(records.tobytes())
        else:
            # ASCII (slower but human-readable)
            with open(filename, 'w') as f:
                f.write("solid medical_model\n")
                for i, face in enumerate(faces):
                    n = normals[i]
                    f.write(f"  facet normal {n[0]:.6e} {n[1]:.6e} {n[2]:.6e}\n")
                    f.write("    outer loop\n")
                    for j in range(3):
                        v = triangles[i, j]
                        f.write(f"      vertex {v[0]:.6e} {v[1]:.6e} {v[2]:.6e}\n")
                    f.write("    endloop\n  endfacet\n")
                f.write("endsolid medical_model\n")
        
        print(f"   Exported {len(faces):,} faces ({os.path.getsize(filename)/1024:.1f} KB)")
        return filename
    
    @staticmethod
    def export_obj(vertices: np.ndarray, 
                   faces: np.ndarray,
                   filename: str) -> str:
        """Fast OBJ export."""
        print(f"⚡ Fast OBJ export: {filename}")
        
        if not filename.lower().endswith('.obj'):
            filename += '.obj'
        
        with open(filename, 'w') as f:
            f.write(f"# Vertices: {len(vertices)}, Faces: {len(faces)}\n")
            # Vectorized vertex writing
            np.savetxt(f, vertices, fmt='v %.6f %.6f %.6f')
            # Faces (1-indexed)
            np.savetxt(f, faces + 1, fmt='f %d %d %d')
        
        print(f"   Exported ({os.path.getsize(filename)/1024:.1f} KB)")
        return filename


# ============================================================================
# STEP 6: VISUALIZATION (Simplified)
# ============================================================================
class Visualization:
    """Fast visualization utilities."""
    
    @staticmethod
    def plot_slices(volume: np.ndarray, n_slices: int = 6, title: str = "Slices"):
        """Quick slice visualization."""
        indices = np.linspace(0, volume.shape[0]-1, n_slices, dtype=int)
        cols = int(np.ceil(np.sqrt(n_slices)))
        rows = int(np.ceil(n_slices / cols))
        
        fig, axes = plt.subplots(rows, cols, figsize=(10, 10))
        axes = axes.flatten()
        
        for i, idx in enumerate(indices):
            axes[i].imshow(volume[idx], cmap='gray')
            axes[i].set_title(f'Slice {idx}')
            axes[i].axis('off')
        
        for i in range(n_slices, len(axes)):
            axes[i].axis('off')
        
        plt.suptitle(title)
        plt.tight_layout()
        plt.show()
    
    @staticmethod
    def plot_3d_mesh_matplotlib(vertices: np.ndarray, 
                                 faces: np.ndarray,
                                 title: str = "3D Model",
                                 max_faces: int = 30000):
        """Fast matplotlib 3D visualization."""
        print(f"📊 Displaying 3D mesh...")
        
        fig = plt.figure(figsize=(10, 10))
        ax = fig.add_subplot(111, projection='3d')
        
        # Subsample for speed
        if len(faces) > max_faces:
            idx = np.random.choice(len(faces), max_faces, replace=False)
            display_faces = faces[idx]
        else:
            display_faces = faces
        
        triangles = vertices[display_faces]
        mesh = Poly3DCollection(triangles, alpha=0.7)
        mesh.set_facecolor('skyblue')
        mesh.set_edgecolor('navy')
        mesh.set_linewidth(0.1)
        ax.add_collection3d(mesh)
        
        # Auto scale
        scale = vertices.max() - vertices.min()
        center = (vertices.max(axis=0) + vertices.min(axis=0)) / 2
        ax.set_xlim(center[0] - scale/2, center[0] + scale/2)
        ax.set_ylim(center[1] - scale/2, center[1] + scale/2)
        ax.set_zlim(center[2] - scale/2, center[2] + scale/2)
        
        ax.set_xlabel('X (mm)')
        ax.set_ylabel('Y (mm)')
        ax.set_zlabel('Z (mm)')
        ax.set_title(title)
        
        plt.tight_layout()
        plt.show()
    
    @staticmethod
    def visualize_vtk(vertices: np.ndarray, 
                      faces: np.ndarray,
                      title: str = "Medical 3D Model"):
        """
        Display 3D mesh using VTK (advanced visualization).
        
        VTK provides interactive 3D rendering with rotation, zoom, etc.
        
        Args:
            vertices: Nx3 array of vertex positions
            faces: Mx3 array of triangle indices
            title: Window title
        """
        if not VTK_AVAILABLE:
            print("   Warning: VTK not available, using matplotlib instead")
            Visualization.plot_3d_mesh_matplotlib(vertices, faces, title)
            return
        
        print(f"🎨 Displaying 3D mesh with VTK...")
        
        # Create VTK points
        vtk_points = vtk.vtkPoints()
        for v in vertices:
            vtk_points.InsertNextPoint(v)
        
        # Create VTK cells (triangles)
        vtk_cells = vtk.vtkCellArray()
        for f in faces:
            triangle = vtk.vtkTriangle()
            triangle.GetPointIds().SetId(0, f[0])
            triangle.GetPointIds().SetId(1, f[1])
            triangle.GetPointIds().SetId(2, f[2])
            vtk_cells.InsertNextCell(triangle)
        
        # Create polydata
        polydata = vtk.vtkPolyData()
        polydata.SetPoints(vtk_points)
        polydata.SetPolys(vtk_cells)
        
        # Compute normals for smooth shading
        normals = vtk.vtkPolyDataNormals()
        normals.SetInputData(polydata)
        normals.ComputePointNormalsOn()
        normals.ComputeCellNormalsOff()
        normals.Update()
        
        # Create mapper and actor
        mapper = vtk.vtkPolyDataMapper()
        mapper.SetInputConnection(normals.GetOutputPort())
        
        actor = vtk.vtkActor()
        actor.SetMapper(mapper)
        actor.GetProperty().SetColor(0.8, 0.8, 0.9)  # Light blue-gray
        actor.GetProperty().SetSpecular(0.3)
        actor.GetProperty().SetSpecularPower(20)
        
        # Create renderer
        renderer = vtk.vtkRenderer()
        renderer.AddActor(actor)
        renderer.SetBackground(0.1, 0.1, 0.15)  # Dark background
        
        # Create render window
        render_window = vtk.vtkRenderWindow()
        render_window.AddRenderer(renderer)
        render_window.SetSize(800, 800)
        render_window.SetWindowName(title)
        
        # Create interactor for mouse control
        interactor = vtk.vtkRenderWindowInteractor()
        interactor.SetRenderWindow(render_window)
        
        # Set camera position
        renderer.ResetCamera()
        camera = renderer.GetActiveCamera()
        camera.Zoom(1.2)
        
        # Add axes widget
        axes = vtk.vtkAxesActor()
        widget = vtk.vtkOrientationMarkerWidget()
        widget.SetOutlineColor(0.9, 0.5, 0.1)
        widget.SetOrientationMarker(axes)
        widget.SetInteractor(interactor)
        widget.SetViewport(0.0, 0.0, 0.2, 0.2)
        widget.SetEnabled(1)
        widget.InteractiveOn()
        
        # Start interaction
        render_window.Render()
        interactor.Start()


# ============================================================================
# FAST CONVERTER CLASS
# ============================================================================
class Medical3DConverter:
    """
    Fast 2D-to-3D medical image converter.
    
    Usage:
        converter = Medical3DConverter()
        converter.load_image("xray.png")
        converter.segment()
        converter.extract_surface()
        converter.export("model.stl")
    """
    
    def __init__(self, fast_mode: bool = True):
        self.volume = None
        self.spacing = None
        self.mask = None
        self.vertices = None
        self.faces = None
        self.normals = None
        self.fast_mode = fast_mode
    
    def load_dicom(self, directory: str, max_slices: int = 150):
        """Load DICOM series (with slice limit for speed)."""
        self.volume, self.spacing = MedicalImageReader.read_dicom_series(directory, max_slices)
        return self
    
    def load_png(self, directory: str, pattern: str = "*.png", max_slices: int = 100):
        """Load PNG series."""
        self.volume, self.spacing = MedicalImageReader.read_png_series(directory, pattern, max_slices)
        return self
    
    def load_image(self, filepath: str, target_size: int = 256):
        """Load single image (downsampled for speed)."""
        self.volume, self.spacing = MedicalImageReader.read_single_image(filepath, target_size)
        return self
    
    def segment(self, method: str = 'otsu', threshold: float = None, **kwargs):
        """Fast segmentation."""
        if self.volume is None:
            raise ValueError("Load data first")
        
        if method == 'region_growing':
            self.mask = OrganSegmentation.fast_region_growing(self.volume, **kwargs)
        else:
            self.mask = OrganSegmentation.threshold_segmentation(
                self.volume, threshold=threshold, method=method
            )
        
        self.mask = OrganSegmentation.morphological_cleanup(
            self.mask, fast_mode=self.fast_mode
        )
        return self
    
    def extract_surface(self, step_size: int = 2, simplify: float = 0.5, 
                        smooth_iterations: int = 10):
        """
        Fast surface extraction.
        
        Args:
            step_size: Marching cubes step (2 = 4x faster)
            simplify: Mesh reduction ratio (0.5 = 50% reduction)
            smooth_iterations: Smoothing passes (10 is fast, 20+ for quality)
        """
        if self.mask is None:
            raise ValueError("Segment first")
        
        self.vertices, self.faces, self.normals, _ = SurfaceExtraction.marching_cubes(
            self.mask,
            spacing=tuple(self.spacing),
            step_size=step_size,
            fast_mode=self.fast_mode
        )
        
        if simplify > 0:
            self.vertices, self.faces = SurfaceExtraction.simplify_mesh(
                self.vertices, self.faces, simplify
            )
        
        if smooth_iterations > 0:
            self.vertices = SurfaceExtraction.smooth_mesh(
                self.vertices, self.faces, smooth_iterations
            )
        
        return self
    
    def export(self, filename: str, format: str = 'stl'):
        """Export 3D model."""
        if self.vertices is None:
            raise ValueError("Extract surface first")
        
        if format.lower() == 'stl':
            return ModelExporter.export_stl(self.vertices, self.faces, filename)
        elif format.lower() == 'obj':
            return ModelExporter.export_obj(self.vertices, self.faces, filename)
        else:
            raise ValueError(f"Unknown format: {format}")
    
    def visualize(self, use_vtk: bool = True):
        """Display 3D mesh."""
        if self.vertices is None:
            raise ValueError("Extract surface first")
        
        if use_vtk and VTK_AVAILABLE:
            Visualization.visualize_vtk(self.vertices, self.faces)
        else:
            Visualization.plot_3d_mesh_matplotlib(self.vertices, self.faces)
        return self
    
    def show_slices(self, n_slices: int = 6):
        """Display volume slices."""
        if self.volume is not None:
            Visualization.plot_slices(self.volume, n_slices, "Volume")
        return self
    
    def convert_fast(self, filepath: str, output: str = "model.stl"):
        """One-line fast conversion."""
        import time
        start = time.time()
        
        self.load_image(filepath)
        self.segment()
        self.extract_surface()
        self.export(output)
        
        elapsed = time.time() - start
        print(f"✅ Complete in {elapsed:.2f}s")
        return self


# ============================================================================
# QUICK CONVERT FUNCTION
# ============================================================================
def convert_fast(input_path: str, output_path: str = "model.stl", 
                 threshold: float = None, visualize: bool = False):
    """
    Quick one-liner to convert medical image to 3D.
    
    Args:
        input_path: Image file or DICOM folder
        output_path: Output STL/OBJ file
        threshold: Segmentation threshold (auto if None)
        visualize: Show 3D visualization
    
    Returns:
        Medical3DConverter instance
    """
    import time
    start = time.time()
    print("=" * 50)
    print("⚡ FAST MEDICAL 3D CONVERTER")
    print("=" * 50)
    
    converter = Medical3DConverter(fast_mode=True)
    
    if os.path.isdir(input_path):
        converter.load_dicom(input_path)
    else:
        converter.load_image(input_path)
    
    converter.segment(threshold=threshold)
    converter.extract_surface()
    converter.export(output_path)
    
    if visualize:
        converter.visualize()
    
    print(f"\n✅ Done in {time.time() - start:.2f} seconds")
    return converter


# ============================================================================
# CLI
# ============================================================================
def main():
    """Command-line interface."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fast Medical 2D to 3D Converter")
    parser.add_argument('--input', '-i', required=True, help='Input image/folder')
    parser.add_argument('--output', '-o', default='model.stl', help='Output file')
    parser.add_argument('--threshold', '-t', type=float, default=None)
    parser.add_argument('--simplify', '-s', type=float, default=0.5)
    parser.add_argument('--visualize', '-v', action='store_true')
    
    args = parser.parse_args()
    
    convert_fast(
        args.input, 
        args.output, 
        threshold=args.threshold, 
        visualize=args.visualize
    )


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        main()
    else:
        print("⚡ Fast Medical 3D Converter")
        print("Usage: python medical_3d_converter.py -i image.png -o model.stl")
        print("\nPython API:")
        print("  from medical_3d_converter import convert_fast")
        print("  convert_fast('xray.png', 'model.stl')")

