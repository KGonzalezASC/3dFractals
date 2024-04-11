import { useGLTF } from '@react-three/drei'
import  * as THREE from 'three';
import {Mesh} from "three";

// Ensure the Model component accepts scale and position props
export const Model = ({ scale, position, rotation }: { scale: [number, number, number]; position: [number, number, number]; rotation: [number, number, number] }) => {
    const gltf = useGLTF('biker_duck.gltf');
    const material = new THREE.MeshBasicMaterial({ color: "green" });
    const standardScale = new THREE.Vector3(0.007, 0.007, 0.007); // Example scale factor to scale down the model
    const scaleVector = new THREE.Vector3(...scale);
    gltf.scene.scale.copy(standardScale);
    gltf.scene.scale.multiply(scaleVector);

    gltf.scene.position.set(...position);
    gltf.scene.rotation.set(...rotation);

    gltf.scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
            child.material = material;
        }
    });
    return <primitive object={gltf.scene} dispose={null} />;
};

interface CustomModelComponentProps {
    size: number;
    position: [number, number, number];
    rotation: [number, number, number]; // Add rotation prop
}


export const CustomModelComponent: React.FC<CustomModelComponentProps> = ({ position, size, rotation }) => {
    const scale: [number, number, number] = [size, size, size];
    return (
        <Model scale={scale} position={position} rotation={rotation} />
    );
};

