/**
 * Uploads a file to Firebase storage
 * @param {File} file - The file to upload
 * @param {string} path - Storage path
 * @param {Object} metadata - Additional metadata
 * @returns {Promise} Upload task promise
 */
function uploadFile(file, path, metadata = {}) {
    return new Promise((resolve, reject) => {
        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        // Create storage reference
        const storageRef = fbStorage.ref();
        const fileRef = storageRef.child(`${path}/${fileName}`);
        
        // Upload file
        const uploadTask = fileRef.put(file, metadata);
        
        // Monitor upload progress
        uploadTask.on('state_changed', 
            // Progress function
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload progress: ' + progress + '%');
            }, 
            // Error function
            (error) => {
                reject(error);
            }, 
            // Complete function
            () => {
                // Get download URL
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    // Create file record in database
                    const fileData = {
                        name: file.name,
                        storageName: fileName,
                        type: file.type,
                        size: file.size,
                        path: path,
                        downloadURL: downloadURL,
                        uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        uploadedBy: fbAuth.currentUser ? fbAuth.currentUser.uid : null,
                        metadata: metadata.customMetadata || {}
                    };
                    
                    // Add file record to Firestore
                    fbDb.collection('files').add(fileData)
                        .then((docRef) => {
                            resolve({
                                id: docRef.id,
                                ...fileData
                            });
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            }
        );
    });
}

/**
 * Gets all files from a specific path
 * @param {string} path - Storage path to filter by
 * @returns {Promise} Promise resolving with file list
 */
function getFiles(path) {
    return fbDb.collection('files')
        .where('path', '==', path)
        .orderBy('uploadedAt', 'desc')
        .get()
        .then((snapshot) => {
            const files = [];
            snapshot.forEach((doc) => {
                files.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return files;
        });
}

/**
 * Deletes a file
 * @param {string} fileId - File ID
 * @returns {Promise} Delete operation promise
 */
function deleteFile(fileId) {
    return new Promise((resolve, reject) => {
        // Get file data first
        fbDb.collection('files').doc(fileId).get()
            .then((doc) => {
                if (!doc.exists) {
                    reject(new Error('File not found'));
                    return;
                }
                
                const fileData = doc.data();
                const storageRef = fbStorage.ref();
                const fileRef = storageRef.child(`${fileData.path}/${fileData.storageName}`);
                
                // Delete from storage
                return fileRef.delete();
            })
            .then(() => {
                // Delete from database
                return fbDb.collection('files').doc(fileId).delete();
            })
            .then(() => {
                resolve({ success: true });
            })
            .catch((error) => {
                reject(error);
            });
    });
}

/**
 * Creates a record of an educational material in Firestore
 * @param {Object} materialData - The material data
 * @returns {Promise} Creation promise
 */
function createMaterial(materialData) {
    return new Promise((resolve, reject) => {
        // Validate required fields
        if (!materialData.title || !materialData.type || !materialData.description) {
            reject(new Error("Missing required fields: title, type, and description are required"));
            return;
        }

        // Create material record in database
        const material = {
            title: materialData.title,
            type: materialData.type,  // e.g., "document", "link", "video", etc.
            description: materialData.description,
            category: materialData.category || "Uncategorized",
            audience: materialData.audience || "All", 
            externalUrl: materialData.externalUrl || "",  // Link to externally hosted content
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: fbAuth.currentUser ? fbAuth.currentUser.uid : null,
        };

        // Add content as base64 for small text files only (optional, for very small files)
        if (materialData.content && materialData.content.length < 500000) { // ~500KB limit
            material.content = materialData.content;
        }
        
        // Add material record to Firestore
        fbDb.collection('materials').add(material)
            .then((docRef) => {
                resolve({
                    id: docRef.id,
                    ...material
                });
            })
            .catch((error) => {
                console.error("Error creating material:", error);
                reject(error);
            });
    });
}

/**
 * Gets all materials, with optional filtering
 * @param {string} category - Optional category to filter by
 * @param {string} audience - Optional audience to filter by
 * @returns {Promise} Promise resolving with materials list
 */
function getMaterials(category = null, audience = null) {
    let query = fbDb.collection('materials');
    
    // Apply filters if provided
    if (category) {
        query = query.where('category', '==', category);
    }
    
    if (audience) {
        query = query.where('audience', '==', audience);
    }
    
    return query
        .orderBy('createdAt', 'desc')
        .get()
        .then((snapshot) => {
            const materials = [];
            snapshot.forEach((doc) => {
                materials.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return materials;
        });
}

/**
 * Gets a single material by ID
 * @param {string} materialId - Material ID
 * @returns {Promise} Promise resolving with material data
 */
function getMaterialById(materialId) {
    return fbDb.collection('materials').doc(materialId).get()
        .then((doc) => {
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                throw new Error("Material not found");
            }
        });
}

/**
 * Updates an existing material
 * @param {string} materialId - Material ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise} Update promise
 */
function updateMaterial(materialId, updateData) {
    // Remove fields that shouldn't be updated directly
    const { id, createdAt, createdBy, ...dataToUpdate } = updateData;
    
    // Add updated timestamp
    dataToUpdate.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    
    return fbDb.collection('materials').doc(materialId).update(dataToUpdate);
}

/**
 * Deletes a material
 * @param {string} materialId - Material ID to delete
 * @returns {Promise} Delete operation promise
 */
function deleteMaterial(materialId) {
    return fbDb.collection('materials').doc(materialId).delete();
}

// Make functions available globally
window.uploadFile = uploadFile;
window.getFiles = getFiles;
window.deleteFile = deleteFile;
window.createMaterial = createMaterial;
window.getMaterials = getMaterials;
window.getMaterialById = getMaterialById;
window.updateMaterial = updateMaterial;
window.deleteMaterial = deleteMaterial;