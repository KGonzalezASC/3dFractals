import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {useFrame} from "@react-three/fiber";
import {useGLTF} from "@react-three/drei";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import {Addition, Base, CSGGeometryRef, Geometry, Subtraction} from '@react-three/csg';


interface Sphere {
    position: [number, number, number];
}




interface SierpinskiPyramidProps {
    size: number,
    iterations: number,
    position?: [number, number, number],
    wireframe?: boolean,
    onGeometryReady?: (geometry: THREE.BufferGeometry) => void;
    spheres?: Sphere[];
}

export const SierpinskiPyramid: React.FC<SierpinskiPyramidProps> = ({ size, iterations, position = [0, 12, 0], wireframe = false }) => {
    const group = useRef<THREE.Group>(null);
    const { nodes } = useGLTF('rat.gltf');
    console.log(nodes);


    // Memoizing in attempt to optimize performance
    const colors = useMemo(() => ["red", "blue", "green", "yellow", "orange", "purple"], []);

    const generateSierpinski = useCallback((parameters: { size: number }, iterations: number, position: [number, number, number]) => {
        const { size } = parameters;
        const smallerSize = size / 2;

        if (iterations === 0) {
            // const geometry = new THREE.BoxGeometry(size, size, size);
            // const material = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)], wireframe });
            // const cube = new THREE.Mesh(geometry, material);
            // cube.position.set(...position);
            // group.current?.add(cube);
            const clonedMesh = nodes.mesh_0.clone() as THREE.Mesh;
            const material = new THREE.MeshStandardMaterial({
                color:colors[Math.floor(Math.random() * colors.length)],
                wireframe: wireframe,
            });
            clonedMesh.position.set(...position);
            clonedMesh.material = material;
            //assume local space is shit
            clonedMesh.scale.set(  smallerSize*.05,  smallerSize*.05, smallerSize* 0.05);

            group.current?.add(clonedMesh); //add instance of primitive



            return;
        }

        //make each cube half the size of the previous one * random smaller size


        // Calculate the positions for the four smaller cubes
        const positions: [number, number, number][] = [
            [position[0], position[1] + smallerSize, position[2]],
            [position[0] + smallerSize, position[1], position[2]],
            [position[0] - smallerSize, position[1], position[2]],
            [position[0], position[1], position[2] + smallerSize],
            [position[0], position[1], position[2] - smallerSize]
        ];

        // Recursively generate the smaller cubes
        positions.forEach((pos) => {
            generateSierpinski({ size: smallerSize }, iterations - 1, pos);
        });
    }, [nodes,colors, wireframe]);


    useEffect(() => {
        if (!group.current) return;

        // group.current.clear();
        group.current.remove(...group.current.children)
        // First call
        generateSierpinski({ size }, iterations, position);
    }, [size, iterations, position, generateSierpinski]);

    useFrame(() => {
        if (group.current) {
            let primitiveCount = 0;
            group.current.traverse((object) => {
                // noinspection SuspiciousTypeOfGuard
                if (object instanceof THREE.Mesh) {
                    primitiveCount++;
                }
            });
            console.log(`Number of primitives in the scene: ${primitiveCount}`);
        }});




    return (
        <group ref={group} />
    );
};


type Branch = {
    size: number;
    position: [number, number, number];
};




//pythagoras tree variant
export const PythagorasTree: React.FC<SierpinskiPyramidProps> = ({ size, iterations, position = [0, 0, 0], wireframe = false }) => {
    const group = useRef<THREE.Group>(null);
    //separate ref for the model
    const models = useRef<THREE.Mesh[]>([]);

    const factor = 0.5 * Math.sqrt(2); // Scaling factor
    const colors = useMemo(() => ["red", "blue", "green", "yellow", "orange", "purple"], []);
    const { nodes } = useGLTF('biker_duck.gltf');


    // Function to clone and position the model

    const generateTree = useCallback((size: number, position: [number, number, number], angle: number, level: number): Branch[] => {
        if (level > iterations || size < 1) {
            return [];
        }

        const nextSize = (size * factor);
        const rotationAngle = Math.PI / 4;
        const branches: Branch[] = [
            { size: nextSize, position: [position[0] + nextSize * Math.cos(angle + rotationAngle), position[1] + nextSize * Math.sin(angle + rotationAngle), position[2]] },
            { size: nextSize, position: [position[0] + nextSize * Math.cos(angle - rotationAngle), position[1] + nextSize * Math.sin(angle - rotationAngle), position[2]] },
        ];



        return [
            ...branches,
            ...generateTree(nextSize, branches[0].position, angle + rotationAngle, level + 1),
            ...generateTree(nextSize, branches[1].position, angle - rotationAngle, level + 1),
        ];
    }, [iterations, factor]);


    const tree = useMemo(() => generateTree(size, position, 0, 0), [generateTree, size, position]);

    // // Animate the tree
    useFrame(() => {
        if (group.current) {
            group.current.rotation.y += 0.01;
            // let primitiveCount = 0;
            // group.current.traverse((object) => {
            //     if (object instanceof THREE.Mesh) {
            //         primitiveCount++;
            //     }
            // });
            // console.log(`Number of primitives in the scene: ${primitiveCount}`);
        }
    models.current.forEach((mesh) => {
            mesh.rotation.x += 0.1;
        });

    });

    // return (
    //     <group ref={group}>
    //         {tree.map((branch, index) => (
    //             // <mesh key={index} position={branch.position}>
    //             //     <boxGeometry args={[branch.size, branch.size, branch.size]} />
    //             //     <meshStandardMaterial wireframe={wireframe} color={colors[Math.floor(Math.random() * colors.length)]} />
    //             // </mesh>
    //             <mesh key={index} position={branch.position} >
    //                 <primitive object={nodes.mesh_0.clone()} scale ={[branch.size  * .01, branch.size * .01, branch.size * .01]}/>
    //                 <meshStandardMaterial wireframe={wireframe} color={colors[Math.floor(Math.random() * colors.length)]} />
    //             </mesh>
    //         ))}
    //     </group>
    // );
    return (
        <group ref={group}>
            {tree.map((branch, index) => {
                //not cloning only makes one primitive also u MUST cast to set material
                const clonedMesh = nodes.mesh_0.clone() as THREE.Mesh;
                clonedMesh.material = new THREE.MeshStandardMaterial({
                    color: colors[index % colors.length], // Use modulo to cycle through colors
                    wireframe: wireframe,
                });
                //assume local space is shit
                clonedMesh.scale.set(branch.size * 0.01, branch.size * 0.01, branch.size * 0.01);
                //add each one to mesh array
                models.current[index] = clonedMesh;

                return (
                    <primitive key={index} object={clonedMesh} position={branch.position} />
                );
            })}
        </group>
    );
};






interface Sphere {
    radius: number;
    position: [number, number, number];
}


const PythagorasPathTree = ({ size, iterations, position = [0, 0, 0] }: SierpinskiPyramidProps):  THREE.ShapePath[]  => {
    // const group = useRef<THREE.Group>(null);
    // const colors = useMemo(() => ["red", "blue", "green", "yellow", "orange", "purple"], []);
    const factor = 0.5 * Math.sqrt(2); // Scaling factor

    const PathTree = useCallback((size: number, position: [number, number, number], angle: number, level: number): THREE.ShapePath[] => {
        if (level > iterations || size < 1) {
            return [];
        }

        const nextSize = (size * factor);
        // /2 makes sqaure
        const rotationAngle = Math.PI / 4;
        const branches: THREE.ShapePath[] = [
            new THREE.ShapePath().moveTo(position[0], position[1]).lineTo(position[0] + nextSize * Math.cos(angle + rotationAngle), position[1] + nextSize * Math.sin(angle + rotationAngle)),
            new THREE.ShapePath().moveTo(position[0], position[1]).lineTo(position[0] + nextSize * Math.cos(angle - rotationAngle), position[1] + nextSize * Math.sin(angle - rotationAngle)),
        ];


        return [
            ...branches,
            ...PathTree(nextSize, [position[0] + nextSize * Math.cos(angle + rotationAngle), position[1] + nextSize * Math.sin(angle + rotationAngle), position[2]], angle + rotationAngle, level + 1),
            ...PathTree(nextSize, [position[0] + nextSize * Math.cos(angle - rotationAngle), position[1] + nextSize * Math.sin(angle - rotationAngle), position[2]], angle - rotationAngle, level + 1),
        ];
    }, [iterations, factor]);


    return useMemo(() => PathTree(size, position, 0, 0), [PathTree, size, position]);
};



const shapePathsToGeometry = (shapePaths: THREE.ShapePath[], extrudeSettings: { depth: number; bevelEnabled: boolean; steps: number }): THREE.BufferGeometry[] => {
    return shapePaths.map(path => {
        return new THREE.ExtrudeGeometry(path.toShapes(true), extrudeSettings);
    });
};






const PythagorasSphereTree = ({ size, iterations, position = [0, 0, 0] as [number, number, number], wireframe = false }: { size: number; iterations: number; position?: [number, number, number]; wireframe?: boolean }): [number, number, number][] => {
    const factor = 0.5 * Math.sqrt(2); // Scaling factor

    const SphereTree = (size: number, position: [number, number, number], angle: number, level: number): [number, number, number][] => {
        if (level > iterations || size < 1) {
            return [];
        }

        const nextSize = (size * factor);
        const rotationAngle = Math.PI / 4;

        // Calculate the positions for the two spheres at this level
        const positions: [number, number, number][] = [
            [position[0] + nextSize * Math.cos(angle + rotationAngle), position[1] + nextSize * Math.sin(angle + rotationAngle), position[2]+2.5],
            [position[0] + nextSize * Math.cos(angle - rotationAngle), position[1] + nextSize * Math.sin(angle - rotationAngle), position[2]+2.5]
        ];

        // Recursively calculate the positions for the next levels
        const nextLevelPositions = [
            ...SphereTree(nextSize, [position[0] + nextSize * Math.cos(angle + rotationAngle), position[1] + nextSize * Math.sin(angle + rotationAngle), position[2]], angle + rotationAngle, level + 1),
            ...SphereTree(nextSize, [position[0] + nextSize * Math.cos(angle - rotationAngle), position[1] + nextSize * Math.sin(angle - rotationAngle), position[2]], angle - rotationAngle, level + 1)
        ];

        // Combine the positions from this level with those from the next levels
        return [...positions, ...nextLevelPositions];
    };

    // Call the SphereTree function to generate the positions
    return SphereTree(size, position, 0, 0);
};





//make rotate copy in z axis figure out how to increatse bvh depth

export const ResultTree: React.FC = () => {
    const sphereGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    // const colors = useMemo(() => ["red", "blue", "green", "yellow", "orange", "purple"], []);
    const csg = useRef<CSGGeometryRef | null>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    // const meshRef2 = useRef<THREE.Mesh>(null);
    //nomrally 20:7
    const shapePaths = PythagorasPathTree({ size: 20, iterations: 6 });
    const geometries = shapePathsToGeometry(shapePaths, {
        steps: 1,
        depth: 3,
        bevelEnabled: false,
    });
    const combinedGeometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>= BufferGeometryUtils.mergeGeometries(geometries);
    //size must be double : o iterations must be  < path tree as well  current is 40:5
    const spherePositions = PythagorasSphereTree({ size: 40, iterations: 5 });

    useEffect(() => {
        if (meshRef.current ) {
        //&& meshRef2.current
        // Rotate the mesh around the y-axis
        meshRef.current.rotation.y += 12;
        // meshRef2.current.rotation.x-=12;
        }
    }, []);

    const printBox = new THREE.BoxGeometry(200, 200, 1, 1, 2, 1);


    return (  
        <group>
            <mesh receiveShadow castShadow ref={meshRef}>
                <meshStandardMaterial color={"red"}/>
                {/*<Geometry ref={csg} computeVertexNormals>*/}
                {/*    <Base geometry={printBox} scale={[1,1,1]} position={[0,0,0]}></Base>*/}
                {/*    {spherePositions && spherePositions.map((position, index) => (*/}
                {/*        <Subtraction*/}
                {/*            key={`subtraction-${index}-${position[0]}-${position[1]}-${position[2]}`}*/}
                {/*            geometry={sphereGeometry}*/}
                {/*            scale={[1, 1, 14]}*/}
                {/*            position={position}*/}
                {/*        />*/}
                {/*    ))}*/}
                {/*    <Addition geometry={combinedGeometry} scale={[2, 2, 10]} position={[0, 0, -1]}></Addition>*/}


                {/*</Geometry>*/}


                <Geometry ref={csg} computeVertexNormals>
                    {/* if errors on base and subtraction or etc.. ignore, not sure why they are happening lol */}
                    <Base geometry={combinedGeometry} scale={[2, 2, 2]} position={[0, 0, 0]}></Base>
                    {spherePositions && spherePositions.map((position, index) => (
                        <Subtraction
                            key={`subtraction-${index}-${position[0]}-${position[1]}-${position[2]}`}
                            geometry={sphereGeometry}
                            scale={[1, 1, 1]}
                            position={position}
                        />
                    ))}
                </Geometry>
            </mesh>

        </group>
    );
};


